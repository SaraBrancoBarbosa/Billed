/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import { ROUTES_PATH} from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import router from "../app/Router.js"

// To use the mocked data for the API simulation
jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  // To prepare the Employee environment
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", { value: localStorageMock })
      
    window.localStorage.setItem("user", JSON.stringify({
      type: "Employee"
    }))

    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.append(root)

    router()
  })

  describe("When I am on Bills Page", () => {
    beforeEach(() => {
      window.onNavigate(ROUTES_PATH.Bills)
    })

    // GET Bills
    test("Then fetches bills from mock API GET", async () => {
      // To check if the page loads with the page title
      const pageTitle = screen.getByText("Mes notes de frais")
      expect(pageTitle).toBeTruthy()
    })

    test("Then bill icon in vertical layout should be highlighted", async () => {
      await waitFor(() => screen.getByTestId("icon-window"))
      const windowIcon = screen.getByTestId("icon-window")
      // Expect expression added
      expect(windowIcon.classList.contains("active-icon")).toBe(true)
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    test("Then I can see if my bills were validated or not", () => {
      // To test with the mocked bills since these have the 3 status
      jest.spyOn(mockStore, "bills")

      const statusPending = screen.getAllByText("pending")
      const statusAccepted = screen.getAllByText("accepted")
      const statusRefused = screen.getAllByText("refused")
     
      expect(statusPending).toHaveLength(1)
      expect(statusAccepted).toHaveLength(1)
      expect(statusRefused).toHaveLength(2)
    })
  })

  describe("I am on Bills Page and I click on the eye icon to open the bill document", () => {
    test("Then the modal opens", async () => {
      // To declare the modal (because of jquery)
      $.fn.modal = jest.fn()
      window.onNavigate(ROUTES_PATH.Bills)
      
      const iconsEye = await waitFor(() => screen.getAllByTestId("icon-eye"))
      
      // To select the first eye of the list (for example)
      const firstIconEye = iconsEye[0]

      userEvent.click(firstIconEye)

      const modal =  await waitFor(() => screen.getByTestId("modaleFile"))
      expect(modal).toBeTruthy()
    })
  })

  describe("I am on Bills Page and I click on 'Nouvelle note de frais'", () => {
    test("Then the 'Envoyer une note de frais' page opens", async () => {
      window.onNavigate(ROUTES_PATH.Bills)
      const btnNewBill = await waitFor(() => screen.getByTestId("btn-new-bill"))
      
      userEvent.click(btnNewBill)

      const formNewBill = await waitFor(() => screen.getByTestId("form-new-bill"))
      expect(formNewBill).toBeTruthy()    
    })
  })  
  
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
    })

    test("Then fetches bills from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
        }
      })

      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick)
      const message = await waitFor(() => screen.getByText(/Erreur 404/))
      expect(message).toBeTruthy()
    })

    test("Then fetches messages from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
        }})

      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick)
      const message = await waitFor(() => screen.getByText(/Erreur 500/))
      expect(message).toBeTruthy()
    })
  }) 

})