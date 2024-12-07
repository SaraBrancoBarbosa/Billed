/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom"
import { ROUTES_PATH} from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"
import router from "../app/Router.js"
import NewBill from "../containers/NewBill.js"

// To use the mocked data for the API simulation
jest.mock("../app/store", () => mockStore)

// To init an object by using the NewBill class
const initNewBill = () => {
  return new NewBill({
    document,
    onNavigate,
    store: mockStore,
    localStorage: window.localStorage,
  })
}

describe("Given I am connected as an employee", () => {
  // To prepare the Employee environment
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee'
    }))

    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.append(root)

    router()
  })

  describe("When I am on NewBill Page", () => {
    beforeEach(() => {
      window.onNavigate(ROUTES_PATH.NewBill)
    })

    test("Then the form is displayed", () => {
      const form = screen.getByTestId("form-new-bill")
      expect(form).toBeTruthy()
    })

    test("Then all the form fields are displayed", () => {
      const expenseType = screen.getByTestId("expense-type")
      const expenseName = screen.getByTestId("expense-name")
      const amount = screen.getByTestId("amount")
      const datePicker = screen.getByTestId("datepicker")
      const vat = screen.getByTestId("vat")
      const pct = screen.getByTestId("pct")
      const commentary = screen.getByTestId("commentary")
      const file = screen.getByTestId("file")
      
      expect(expenseType).toBeTruthy()
      expect(expenseName).toBeTruthy()
      expect(amount).toBeTruthy()
      expect(datePicker).toBeTruthy()
      expect(vat).toBeTruthy()
      expect(pct).toBeTruthy()
      expect(commentary).toBeTruthy()
      expect(file).toBeTruthy()
    })
  })

  describe("When I am on NewBill Page and I upload a file", () => {
    beforeEach(() => {
      window.onNavigate(ROUTES_PATH.NewBill)
    })

    test("Then only the jpg, jpeg and png formats are accepted", async () => {
      const fileInput = screen.getByTestId("file")
      
      // 2 files simulation (valid/invalid)
      const validFile = new File([""], "test.jpg", { type: "image/jpeg" })
      const invalidFile = new File([""], "test.pdf", { type: "application/pdf" })
      
      // The valid file
      fireEvent.change(fileInput, { target: { files: [validFile] } })
      expect(fileInput.files[0].name).toMatch(/\.(jpg|jpeg|png)$/i)
      
      // The invalid file
      fireEvent.change(fileInput, { target: { files: [invalidFile] } })
      expect(fileInput.files[0].name).not.toMatch(/\.(jpg|jpeg|png)$/i)
    })

    test("Then an error message is displayed to clarify the requested format", async () => {
      const fileInput = screen.getByTestId("file")
      const invalidFile = new File([""], "test.pdf", { type: "application/pdf" })
      
      // Invalid file simulation
      fireEvent.change(fileInput, { target: { files: [invalidFile] } })
      
      expect(screen.getAllByText("Veuillez joindre un fichier avec une extension .jpg, .jpeg ou .png.")).toBeTruthy()
    })
  })

  // POST NewBill
  describe("When I am on NewBill Page and I click on 'Envoyer' to submit", () => {
    beforeEach(() => {
      window.onNavigate(ROUTES_PATH.NewBill)
    })

    test("Then the submission is a success when all the fields are filled and I'm send to the Bills page", async () => {
      const newBill = initNewBill()

      // To take the first mocked bill
      const bill = (await mockStore.bills().list())[0]
      
      // To check the fields
      const fieldType = screen.getByTestId("expense-type")
      fireEvent.change(fieldType, { target: { value: bill.type } })
      expect(fieldType.value).toBe(bill.type)
      
      const fieldName = screen.getByTestId("expense-name")
      fireEvent.change(fieldName, { target: { value: bill.name } })
      expect(fieldName.value).toBe(bill.name)

      const fieldAmount = screen.getByTestId("amount")
      fireEvent.change(fieldAmount, { target: { value: bill.amount } })
      expect(parseInt(fieldAmount.value)).toBe(parseInt(bill.amount))

      const fieldDate = screen.getByTestId("datepicker")
      fireEvent.change(fieldDate, { target: { value: bill.date } })
      expect(fieldDate.value).toBe(bill.date)

      const fieldVat = screen.getByTestId("vat")
      fireEvent.change(fieldVat, { target: { value: bill.vat } })
      expect(parseInt(fieldVat.value)).toBe(parseInt(bill.vat))

      const fieldPct = screen.getByTestId("pct")
      fireEvent.change(fieldPct, { target: { value: bill.pct } })
      expect(parseInt(fieldPct.value)).toBe(parseInt(bill.pct))

      const fieldCommentary = screen.getByTestId("commentary")
      fireEvent.change(fieldCommentary, { target: { value: bill.commentary } })
      expect(fieldCommentary.value).toBe(bill.commentary)

      // And to check the file
      const newBillForm = screen.getByTestId("form-new-bill")
      
      // To mock a function assigned to handleChangeFile
      const handleChangeFile = jest.fn(newBill.handleChangeFile)
      newBillForm.addEventListener("change", handleChangeFile)
      
      const fileField = screen.getByTestId("file")
      // New File with an array containing an empty Blob (which represents the content of the file)
      fireEvent.change(fileField, 
        { target: { 
          files: [ 
            new File([new Blob()], bill.fileName, { type: "image/jpg" }) ] 
          } 
        })
      expect(fileField.files[0].name).toBe(bill.fileName)
      expect(fileField.files[0].type).toBe("image/jpg")
      expect(handleChangeFile).toHaveBeenCalled()

      // Then submitting the form to check handleSubmit
      const handleSubmit = jest.fn(newBill.handleSubmit)
      newBillForm.addEventListener("submit", handleSubmit)
      fireEvent.submit(newBillForm)
      expect(handleSubmit).toHaveBeenCalled()
    })  

    test("Then submitting fails with a 500 message error", async () => {
      const newBill = initNewBill()

        const mockedBill = jest.spyOn(mockStore, "bills").mockImplementationOnce(() => {
          return {
            create: jest.fn().mockRejectedValue(new Error("Erreur 500")),
          }
        })

        await expect(mockedBill().create).rejects.toThrow("Erreur 500")

        expect(mockedBill).toHaveBeenCalledTimes(1)

        // To check that "create" failed as wanted, so the following expectations have to be null (like in the constructor)
        expect(newBill.fileUrl).toBeNull()
        expect(newBill.fileName).toBeNull()
        expect(newBill.fileForm).toBeNull()
        expect(newBill.billId).toBeNull()
    })
  })
})