/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import {localStorageMock} from "../__mocks__/localStorage.js";
import { ROUTES_PATH} from "../constants/routes.js";
import router from "../app/Router.js"
import store from "../__mocks__/store.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then all required elements should be present", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      const form = screen.getByTestId("form-new-bill")
      expect(form).toBeTruthy()

      const expenseTypeInput = screen.getByTestId("expense-type")
      expect(expenseTypeInput).toBeTruthy()

      const expenseNameInput = screen.getByTestId("expense-name")
      expect(expenseNameInput).toBeTruthy()

      const datepickerInput = screen.getByTestId("datepicker")
      expect(datepickerInput).toBeTruthy()

      const amountInput = screen.getByTestId("amount")
      expect(amountInput).toBeTruthy()

      const vatInput = screen.getByTestId("vat")
      expect(vatInput).toBeTruthy()

      const pctInput = screen.getByTestId("pct")
      expect(pctInput).toBeTruthy()

      const commentaryTextarea = screen.getByTestId("commentary")
      expect(commentaryTextarea).toBeTruthy()

      const fileInput = screen.getByTestId("file")
      expect(fileInput).toBeTruthy()
    })
  })

  describe("When I handle file change", () => {
    const localStorage = {
      getItem: jest.fn(() => JSON.stringify({ email: "test@example.com" })),
    };

    beforeAll(() => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'test@test.com'
      }));
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
    });

    test("Then file should be uploaded if it meets the requirements", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      const newBill = new NewBill({ document, onNavigate: null, store, localStorage });

      const handleChangeFile = jest.spyOn(newBill, "handleChangeFile");

      const fileInput = screen.getByTestId("file");
      fileInput.addEventListener("change", handleChangeFile);
      const file = new File(["file content"], "filename.jpg", { type: "image/jpeg" });

      userEvent.upload(fileInput, file);

      expect(handleChangeFile).toHaveBeenCalled();
    });

    test("Submitting the form should update the bill and navigate to the bills page", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      const newBill = new NewBill({ document, onNavigate: jest.fn(), store, localStorage });

      store.bills().update = jest.fn().mockImplementation(() => Promise.resolve());

      const form = screen.getByTestId("form-new-bill");
      form.querySelector(`select[data-testid="expense-type"]`).value = "Hôtel et logement";

      newBill.fileUrl = "test-file-url";
      newBill.fileName = "test-file-name";

      form.dispatchEvent(new Event("submit"));

      await Promise.resolve();

      expect(store.bills().update).toHaveBeenCalledWith({
        data: JSON.stringify({
          type: "Hôtel et logement",
          name: "",
          amount: null,
          date: "",
          vat: "",
          pct: 20,
          commentary: "",
          fileUrl: "test-file-url",
          fileName: "test-file-name",
          status: "pending"
        }),
        selector: null
      });

      expect(newBill.onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
    });
    test("Submitting the form should create a new bill with correct data", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;


      const newBill = new NewBill({ document, onNavigate: jest.fn(), store, localStorage });
      const handleChangeFile = jest.spyOn(newBill, "handleChangeFile");
      const file = new File(["file content"], "filename.jpg", { type: "image/jpeg" });

      const fileInput = screen.getByTestId("file");
      userEvent.upload(fileInput, file);

      const form = screen.getByTestId("form-new-bill");
      form.querySelector(`select[data-testid="expense-type"]`).value = "Hôtel et logement";
      form.querySelector(`input[data-testid="expense-name"]`).value = "Test expense";
      form.querySelector(`input[data-testid="amount"]`).value = "100";
      form.querySelector(`input[data-testid="datepicker"]`).value = "2024-05-10";
      form.querySelector(`input[data-testid="vat"]`).value = "VAT123";
      form.querySelector(`input[data-testid="pct"]`).value = "20";
      form.querySelector(`textarea[data-testid="commentary"]`).value = "Test commentary";

      store.bills().create = jest.fn().mockImplementationOnce((data) => {
        expect(data).toEqual({
          data: expect.any(FormData),
          headers: {
            noContentType: true
          }
        });

        return Promise.resolve({ fileUrl: "test-file-url", key: "test-key" });
      });
      const result = form.dispatchEvent(new Event("submit"));
      expect(result).toBeTruthy();

      await waitFor(() => {

        expect(newBill.onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
      });
    });
  });
});
