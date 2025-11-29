import {
  debounce,
  formatTime,
  getLocalData,
  injectScriptActiveTab,
  parseScale10ToCharacterAndScale4,
  removeVietnameseTones,
  setLocalData
} from "./utils";
import {
  _ACTION_CREATE,
  _ACTION_UPDATE,
  _ACTIVE_CLASS,
  _ERROR_MESSAGE_TIMEOUT,
  _FLAG_ERROR_KEY,
  _IGNORE_LIST_KEY,
  _POINT_KEY,
  _TIENICHSDH_URL,
  _TIENICHSV_URL,
  _USER_KEY
} from "./constants";
import { closeDialog, getTabURL, GetURLMessageType, removeError, setError, showDialog } from "./utils/globalDOM";
import { ContainerQS, DialogQS, DialogQSA } from "./utils/query";
import {
  _DEFAULT_FIXED_POINT,
  _DEFAULT_IGNORE_SUBJECT_DATA,
  _DEFAULT_POINT_DATA,
  _DEFAULT_USER_DATA
} from "./constants/default";

type GetDataPointMessageType = {
  type: ChromeMessageTypeCategory;
  payload: {
    data: ScoreGroupType[];
  };
};

const getData = async () => {
  try {
    const type: ChromeMessageTypeCategory = "GET_DATA_POINT";
    const tableRows = document.querySelectorAll(
      "table#excel-table > tbody > tr.ng-star-inserted:not(.table-primary), table#excel-table > tbody > tr.text-center.ng-star-inserted"
    );

    const data: ScoreGroupType[] = [];

    Array.from(tableRows).forEach((row, index) => {
      const columns = row.querySelectorAll("td");

      const isHead = !row.classList.contains("bg-white");

      if (isHead) {
        data.push({
          id: index,
          title: columns[0].innerText,
          data: [],
          totalCredit: 0,
          avgPoint: {
            scale10: 0,
            scale4: 0
          }
        });
      }

      if (!isHead) {
        const character = columns[11].innerText as PointCharacterType;

        data[data.length - 1].data.push({
          code: columns[1].innerText,
          name: columns[3].innerText,
          credit: parseFloat(columns[4].innerText) || 0,
          point: {
            scale10: parseFloat(columns[9].innerText),
            scale4: parseFloat(columns[10].innerText),
            character
          }
        });
      }
    });

    const message: GetDataPointMessageType = { type: type, payload: { data } };

    await chrome.runtime
      .sendMessage(message)
      .then(() => console.info("MPC Extension -> Get data success and send to the extension!"))
      .catch((err) => console.error(err));
  } catch (error) {
    console.error(error);
  }
};

const App = () => {
  const pointData: PointDataType = getLocalData(_POINT_KEY, _DEFAULT_POINT_DATA);
  const ignoreListData: IgnoreListType = getLocalData(_IGNORE_LIST_KEY, _DEFAULT_IGNORE_SUBJECT_DATA);

  const appContainer = ContainerQS("#app") as HTMLElement;
  const noDataE = appContainer.querySelector(".no-data") as HTMLElement;
  const mainDataE = appContainer.querySelector(".main-data") as HTMLElement;
  const btnImportDataE = appContainer.querySelector(".btn-import-data") as HTMLElement;
  const btnExportExcelE = appContainer.querySelector(".btn-export-excel") as HTMLElement;
  const updatedAtE = appContainer.querySelector(".updatedAt")! as HTMLElement;
  const checkboxOnlyCalcGPAE = appContainer.querySelector("#only-calc-gpa") as HTMLInputElement;
  const searchInputE = appContainer.querySelector("#search-subject") as HTMLInputElement;
  const tableResultE = appContainer.querySelector("table.data") as HTMLElement;

  // variable
  let listener: (
    request: { type: ChromeMessageTypeCategory; payload: any },
    _sender: chrome.runtime.MessageSender,
    _sendResponse: (response: any) => void
  ) => void;

  const state = {
    data: pointData.data,
    queyText: pointData.queyText,
    isOnlyCalcGPA: pointData.isOnlyCalcGPA,
    updatedAt: pointData.updatedAt
  };

  // function
  const subscribe = () => {
    listener = (request, _sender, _sendResponse) => {
      const { type, payload } = request;

      switch (type as ChromeMessageTypeCategory) {
        case "CHECK_URL": {
          const { URL }: GetURLMessageType["payload"] = payload;

          const _URL_TIENICHSV_DIEM = _TIENICHSV_URL + "/#/diem";
          const _URL_TIENICHSDH_DIEM = _TIENICHSDH_URL + "/#/diem";
          const availableURL = [_URL_TIENICHSV_DIEM, _URL_TIENICHSDH_DIEM];

          if (!URL) {
            setError("Không thể lấy URL của trang hiện tại!");
            setLocalData(_FLAG_ERROR_KEY, true);
            return;
          }

          if (!availableURL.includes(URL)) {
            setLocalData(_FLAG_ERROR_KEY, true);
            setError(`Vui lòng truy cập vào trang <b class="error-nav-link">${_URL_TIENICHSV_DIEM}</b> trước!`);
            noDataE.classList.add(_ACTIVE_CLASS);
            return;
          }

          mainDataE.classList.add(_ACTIVE_CLASS);
          btnImportDataE.classList.add(_ACTIVE_CLASS);
          return;
        }

        case "GET_DATA_POINT": {
          const hasError = getLocalData(_FLAG_ERROR_KEY, false);
          if (hasError) {
            setLocalData(_FLAG_ERROR_KEY, false);
            noDataE.classList.remove(_ACTIVE_CLASS);
            return;
          }

          const { data }: GetDataPointMessageType["payload"] = payload;

          if (!data.length) {
            return;
          }

          state.updatedAt = new Date();

          updateData(data);
          saveDataToLocal();
          noDataE.classList.remove(_ACTIVE_CLASS);
          return;
        }
        default:
          console.error("No type match!");
          return;
      }
    };

    chrome.runtime.onMessage.addListener(listener);
  };

  const unsubscribe = () => {
    chrome.runtime.onMessage.removeListener(listener);
  };

  const firstCheck = () => {
    const checkDataValid = state.data && state.data.length > 0;
    if (checkDataValid) {
      noDataE.classList.remove(_ACTIVE_CLASS);
      mainDataE.classList.add(_ACTIVE_CLASS);
      btnImportDataE.classList.add(_ACTIVE_CLASS);

      searchInputE.value = state.queyText;
      checkboxOnlyCalcGPAE.checked = state.isOnlyCalcGPA;
    } else {
      injectScriptActiveTab(getTabURL);
    }
  };

  const saveDataToLocal = () => {
    setLocalData(_POINT_KEY, {
      data: state.data,
      queyText: state.queyText,
      isOnlyCalcGPA: state.isOnlyCalcGPA,
      updatedAt: state.updatedAt
    });
  };

  const checkIgnore = () => {
    state.data.forEach((d) => {
      d.data.forEach((item) => {
        const isIgnore = ignoreListData.data.find((i) => item.code.includes(i));
        if (isIgnore) item.isIgnore = true;
      });
    });
  };

  const sortDataByIgnore = () => {
    state.data.forEach((d) => {
      d.data.sort((a, b) => {
        return a.isIgnore ? 1 : b.isIgnore ? -1 : 0;
      });
    });
  };

  const updateData = (data?: PointDataType["data"] | undefined) => {
    if (data) state.data = data;
    checkIgnore();
    sortDataByIgnore();
    getTotal();
    renderData();
    saveDataToLocal();
  };

  const getTotal = () => {
    state.data.forEach((d) => {
      const totalCredit = d.data.reduce((acc, curr) => {
        const isIgnoreCredit = curr.isIgnore || !curr.point.character;
        if (isIgnoreCredit) return acc;
        return acc + curr.credit;
      }, 0);

      const avg = d.data.reduce(
        (acc, curr) => {
          const point = curr.point;
          const credit = curr.credit;

          const isIgnore =
            curr.isIgnore || isNaN(credit) || isNaN(point.scale10) || isNaN(point.scale4) || !point.character;
          if (isIgnore) return acc;

          return {
            point: {
              scale10: acc.point.scale10 + point.scale10 * credit,
              scale4: acc.point.scale4 + point.scale4 * credit
            },
            credit: acc.credit + credit
          };
        },
        {
          point: {
            scale10: 0,
            scale4: 0
          },
          credit: 0
        }
      );

      d.totalCredit = totalCredit;
      d.avgPoint = {
        scale10: parseFloat((avg.point.scale10 / avg.credit).toFixed(_DEFAULT_FIXED_POINT)),
        scale4: parseFloat((avg.point.scale4 / avg.credit).toFixed(_DEFAULT_FIXED_POINT))
      };
    });
  };

  const renderData = () => {
    const tableHtmls = state.data
      .map((group, groupIdx) => {
        const data = group.data.map((item, itemIdx) => {
          const isSearch =
            removeVietnameseTones(item.name.toLowerCase()).includes(state.queyText) || state.queyText == "";
          const isHide = !isSearch || (item.isIgnore && state.isOnlyCalcGPA);
          const classValue = `row-data ${item.isIgnore ? "ignore" : ""} ${isHide ? "hide" : ""} `.trim();
          return `
            <tr
                class="${classValue}"
                data-item-idx=${itemIdx}
                data-group-idx=${groupIdx}
                ${item.isIgnore ? 'title="Môn học này không tính vào GPA trung bình"' : ""}
            >
                <td>${item.code}</td>
                <td>${item.name}</td>
                <td style="min-width: 20px;">${item.credit}</td>
                <td style="min-width: 40px;">${item.point?.scale10?.toFixed(1) || ""}</td>
                <td style="min-width: 40px;">${item.point?.scale4?.toFixed(1) || ""}</td>
                <td style="min-width: 40px;">${item.point.character || ""}</td>
                <td class="btn-delete" style="min-width: 20px;">x</td>
            </tr>
            `;
        });

        const dataHtmls = data.join("");

        return `
          <tr class="row-head" data-group-idx=${groupIdx}>
              <td colspan="7">
                <div class="row-wrap">
                  <div class="row-wrap-left"><span>${group.title} (<b>${group.totalCredit} tín chỉ</b>)</span> <span title="Thêm môn học" class="btn btn-add-subject">+</span></div> 
                  <div class="row-wrap-right">
                  <span>
                    Hệ 10: <b>${group.avgPoint?.scale10?.toFixed(_DEFAULT_FIXED_POINT) || NaN}</b>
                  </span>
                  - 
                  <span>
                    Hệ 4: <b>${group.avgPoint?.scale4?.toFixed(_DEFAULT_FIXED_POINT) || NaN}</b>
                  </span>
                  </div>
                </div>
              </td>
          </tr>
          ${dataHtmls}
          `;
      })
      .join("");

    const totalCredit = state.data.reduce((acc, curr) => {
      return acc + curr.totalCredit;
    }, 0);

    const avgTotal = {
      point: {
        scale10: 0,
        scale4: 0
      },
      credit: 0
    };

    state.data.forEach((item) => {
      const isIgnore =
        isNaN(item.avgPoint.scale10) || isNaN(item.avgPoint.scale4) || !item.avgPoint.scale10 || !item.avgPoint.scale4;
      if (isIgnore) return;
      const avg = item.data.reduce(
        (acc, curr) => {
          const point = curr.point;
          const credit = curr.credit;

          if (curr.isIgnore || isNaN(point.scale4) || isNaN(credit)) return acc;
          return {
            point: {
              scale10: acc.point.scale10 + point.scale10 * credit,
              scale4: acc.point.scale4 + point.scale4 * credit
            },
            credit: acc.credit + credit
          };
        },
        {
          point: {
            scale10: 0,
            scale4: 0
          },
          credit: 0
        }
      );

      avgTotal.point.scale10 += avg.point.scale10;
      avgTotal.point.scale4 += avg.point.scale4;
      avgTotal.credit += avg.credit;
    });

    tableResultE.innerHTML = tableHtmls;
    updatedAtE.innerHTML = `(Cập nhật ${formatTime(state.updatedAt)})`;
    appContainer.querySelector(".total-semester span")!.innerHTML = (state.data.length - 1).toString();
    appContainer.querySelector(".total-credit span")!.innerHTML = totalCredit.toString();
    appContainer.querySelector(".avg-point .scale10 span")!.innerHTML = (
      avgTotal.point.scale10 / avgTotal.credit
    ).toFixed(_DEFAULT_FIXED_POINT);
    appContainer.querySelector(".avg-point .scale4 span")!.innerHTML = (
      avgTotal.point.scale4 / avgTotal.credit
    ).toFixed(_DEFAULT_FIXED_POINT);
  };

  const showAppDialog = (
    semester: { title: string; idx: number },
    action: ActionCategory,
    subject?: ScoreRecordType
  ) => {
    const appDialog = DialogQS("[data-id='app']") as HTMLElement;

    appDialog.querySelector(".form-subject .title")!.innerHTML = semester.title;

    const formFieldsetLegend = appDialog.querySelector(".form-subject fieldset legend") as HTMLElement;
    const formSubmitBtn = appDialog.querySelector(".form-subject button.btn-add-subject") as HTMLElement;
    const inputList = appDialog.querySelectorAll(".form-subject input") as NodeListOf<HTMLInputElement>;

    formSubmitBtn.dataset.action = action;
    formSubmitBtn.dataset.idx = semester.idx.toString();

    switch (action) {
      case _ACTION_CREATE:
        formFieldsetLegend.innerHTML = "Thêm môn học";
        formSubmitBtn.innerHTML = "Thêm mới";
        break;
      case _ACTION_UPDATE:
        formFieldsetLegend.innerHTML = "Cập nhật môn học";
        formSubmitBtn.innerHTML = "Cập nhật";

        if (!subject) break;

        inputList[0].value = subject.name;
        inputList[1].value = subject.code;
        inputList[2].value = subject.credit?.toString();
        inputList[3].value = subject.point?.scale10?.toString();
        break;
    }

    showDialog("app");
  };

  const eventHandlers = () => {
    btnImportDataE.onclick = () => {
      injectScriptActiveTab(getTabURL);
      injectScriptActiveTab(getData);
    };

    btnExportExcelE.onclick = () => {
      const worksheetData = [];

      worksheetData.push([
        "STT",
        "Học kỳ",
        "Mã môn học",
        "Tên môn học",
        "Số tín chỉ",
        "Điểm hệ 10",
        "Điểm hệ 4",
        "Xếp loại",
        "Ghi chú (Không tính GPA)"
      ]);

      let stt = 1;
      state.data.forEach((semester) => {
        semester.data.forEach((subject) => {
          worksheetData.push([
            stt++,
            semester.title,
            subject.code,
            subject.name,
            subject.credit,
            subject.point.scale10 ?? "N/A",
            subject.point.scale4 ?? "N/A",
            subject.point.character ?? "N/A",
            subject.isIgnore ? "Không tính" : ""
          ]);
        });
      });

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      worksheet["!cols"] = [
        { width: 5 },
        { width: 30 },
        { width: 15 },
        { width: 50 },
        { width: 10 },
        { width: 10 },
        { width: 10 },
        { width: 10 },
        { width: 20 }
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, "Bảng điểm");
      XLSX.writeFile(workbook, "points.xlsx");
    };

    checkboxOnlyCalcGPAE.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      state.isOnlyCalcGPA = target.checked;
      saveDataToLocal();
      renderData();
    };

    searchInputE.oninput = debounce((e: Event) => {
      const target = e.target as HTMLInputElement;
      const value = target.value.trim().toLowerCase();
      state.queyText = removeVietnameseTones(value);
      saveDataToLocal();
      renderData();
    });

    DialogQS(".form-subject")!.onsubmit = (e: SubmitEvent) => {
      e.preventDefault();
      const submitter = e.submitter as HTMLButtonElement;

      const action = submitter.dataset.action;
      const idx = parseInt(submitter.dataset.idx || "0");

      const inputList = DialogQSA(".form-subject input") as NodeListOf<HTMLInputElement>;
      const name = inputList[0].value.trim();
      const code = inputList[1].value.trim();
      const credit = parseInt(inputList[2].value.trim());
      const scale10 = parseFloat(inputList[3].value.trim());

      if (!name || !code || !credit || !scale10) {
        setError("Vui lòng điền đầy đủ thông tin!");
        return;
      }

      const { scale4, character } = parseScale10ToCharacterAndScale4(scale10);

      const isExist = state.data.find((d) => d.data.find((item) => item.code === code));
      if (isExist && action === _ACTION_CREATE) {
        setError("Mã môn học đã tồn tại!");
        return;
      }

      if (action === _ACTION_CREATE) {
        state.data[idx].data.push({
          name,
          code,
          credit,
          point: {
            scale10,
            scale4,
            character
          }
        });
      }

      if (action === _ACTION_UPDATE) {
        const itemIdx = state.data[idx].data.findIndex((item) => item.code === code);
        state.data[idx].data[itemIdx] = { name, code, credit, point: { scale10, scale4, character } };
      }

      updateData();
      closeDialog();
    };

    tableResultE.onclick = (e: Event) => {
      const target = e.target as HTMLElement;
      const rowData = target.closest(".row-data") as HTMLElement;
      const deleteBtn = target.closest(".btn-delete") as HTMLElement;
      const addSubjectButton = target.closest(".btn-add-subject") as HTMLElement;

      if (deleteBtn) {
        const groupIdx = parseInt(rowData.dataset.groupIdx!);
        const itemIdx = parseInt(rowData.dataset.itemIdx!);

        state.data[groupIdx].data.splice(itemIdx, 1);
        updateData();
        return;
      }

      if (rowData) {
        const groupIdx = parseInt(rowData.dataset.groupIdx!);
        const itemIdx = parseInt(rowData.dataset.itemIdx!);
        const semester = state.data[groupIdx];
        const subject = state.data[groupIdx].data[itemIdx];
        showAppDialog({ title: semester.title, idx: groupIdx }, _ACTION_UPDATE, subject);
        return;
      }

      if (addSubjectButton) {
        const rowHead = target.closest(".row-head") as HTMLElement;
        const semester = state.data[parseInt(rowHead.dataset.groupIdx!)];
        showAppDialog({ title: semester.title, idx: parseInt(rowHead.dataset.groupIdx!) }, _ACTION_CREATE);
        return;
      }
    };
  };

  return {
    onMount() {
      subscribe();
      firstCheck();
      eventHandlers();
      renderData();
    },
    onUnmount() {
      unsubscribe();
    }
  };
};

export { App };
