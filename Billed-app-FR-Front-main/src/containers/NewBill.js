import { ROUTES_PATH } from '../constants/routes.js'
import Logout from "./Logout.js"

export default class NewBill {

  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`)
    formNewBill.addEventListener("submit", this.handleSubmit)
    const file = this.document.querySelector(`input[data-testid="file"]`)
    file.addEventListener("change", this.handleChangeFile)
    this.fileUrl = null
    this.fileName = null
    this.fileForm = null
    this.billId = null
    new Logout({ document, localStorage, onNavigate })
  }

  handleChangeFile = e => {
    e.preventDefault()
    const file = this.document.querySelector(`input[data-testid="file"]`).files[0]
    // to define this.fileForm in the selecting file management function
    this.fileForm = null

    // To allow only the jpg, jpeg and png file extensions
    const allowedExtensions = /(\.jpg|\.jpeg|\.png)$/i
    // regex.exec(string)
    if (!allowedExtensions.exec(file.name)) {
      alert("Veuillez joindre un fichier avec une extension .jpg, .jpeg ou .png.")
      // Then reset the value so the user can try again
      this.document.querySelector(`input[data-testid="file"]`).value = ""
      return
    }

    const filePath = e.target.value.split(/\\/g)
    this.fileName = filePath[filePath.length-1]
    const formData = new FormData()
    const email = JSON.parse(localStorage.getItem("user")).email
    formData.append('file', file)
    formData.append('email', email)
    // Assign formData to this.fileForm: to use it when creating the ticket in the submit
    this.fileForm = formData
  }

  handleSubmit = e => {
    e.preventDefault()

    //console.log('e.target.querySelector(`input[data-testid="datepicker"]`).value', e.target.querySelector(`input[data-testid="datepicker"]`).value)
    
    // The user has to write a bill name before submitting
    const expenseName = e.target.querySelector(`input[data-testid="expense-name"]`).value
    if (!expenseName) {
      alert("Veuillez donner un nom à votre dépense.")
      return
      // To explicitly check that the user enters a file
    } else if (!this.fileForm) {
      alert("Veuillez télécharger un fichier.")
      return
    }

    const email = JSON.parse(localStorage.getItem("user")).email

    // The block is moved here to guarantee that the ticket is only created if all the elements are validated
    // So this includes the entered file
    this.store
      .bills()
      .create({
        data: this.fileForm,
        headers: {
          noContentType: true
        }
      })

      .then(({fileUrl, key}) => {
        console.log(fileUrl)
        this.billId = key
        this.fileUrl = fileUrl
        const bill = {
          email,
          type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
          name:  e.target.querySelector(`input[data-testid="expense-name"]`).value,
          amount: parseInt(e.target.querySelector(`input[data-testid="amount"]`).value),
          date:  e.target.querySelector(`input[data-testid="datepicker"]`).value,
          vat: e.target.querySelector(`input[data-testid="vat"]`).value,
          pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20,
          commentary: e.target.querySelector(`textarea[data-testid="commentary"]`).value,
          fileUrl: this.fileUrl,
          fileName: this.fileName,
          status: 'pending'
        }
        this.updateBill(bill)
        this.onNavigate(ROUTES_PATH['Bills'])
      }).catch(error => console.error(error))
  }

  // not need to cover this function by tests
  updateBill = (bill) => {
    if (this.store) {
      this.store
      .bills()
      .update({data: JSON.stringify(bill), selector: this.billId})
      .then(() => {
        this.onNavigate(ROUTES_PATH['Bills'])
      })
      .catch(error => console.error(error))
    }
  }
}