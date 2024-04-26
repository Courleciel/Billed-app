/**
 * @jest-environment jsdom
 */

import {screen, waitFor, fireEvent} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import '@testing-library/jest-dom/extend-expect';
import router from "../app/Router.js"
import Bills from "../containers/Bills.js";
import { formatDate, formatStatus } from "../app/format.js"

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon).toHaveClass('active-icon');

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
    test("When I click on the New Bill button, Then it should navigate to the New Bill page", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('btn-new-bill'))
      const buttonNewBill = screen.getByTestId('btn-new-bill')
      buttonNewBill.click()
      expect(window.location.hash).toEqual(ROUTES_PATH.NewBill)
    })
    test("Then the modal should open with the correct bill URL when clicking on the eye icon", () => {
      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const firestore = null;
      const localStorage = localStorageMock;
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const billsContainer = new Bills({
        document,
        onNavigate,
        firestore,
        localStorage,
      });
      $.fn.modal = jest.fn();
      const iconEye = screen.getAllByTestId("icon-eye")[0];
      const handleClickIconEye = jest.fn(() =>
        billsContainer.handleClickIconEye(iconEye)
      );
      iconEye.addEventListener("click", handleClickIconEye);
      fireEvent.click(iconEye);
      expect(handleClickIconEye).toHaveBeenCalled();
      expect($.fn.modal).toHaveBeenCalledWith("show");
    });
    test("getBills should return bills with formatted date and status", async () => {
      const mockList = jest.fn().mockResolvedValue([
        { date: "2023-04-26T00:00:00", status: "pending" },
        { date: "2023-04-27T00:00:00", status: "accepted" },
        { date: "2023-04-28T00:00:00", status: "refused" }
      ]);

      const store = {
        bills: jest.fn(() => ({
          list: mockList
        }))
      };

      const billsContainer = new Bills({
        document: document,
        onNavigate: jest.fn(),
        store: store,
        localStorage: localStorageMock
      });

      const bills = await billsContainer.getBills();

      expect(bills).toEqual([
        { date: "26 Avr. 23", status: "En attente" },
        { date: "27 Avr. 23", status: "Accepté" },
        { date: "28 Avr. 23", status: "Refused" }
      ]);

      expect(store.bills().list).toHaveBeenCalled();
    });

  })
})
