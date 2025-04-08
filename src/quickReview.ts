import { _ACTIVE_CLASS } from "./constants";
import { reviewSelectGroups } from "./data/review";
import { ContainerQS } from "./utils/query";

const QuickReview = () => {
    // Lấy các element container cần thiết
    const reviewContainer = ContainerQS("#quick-review") as HTMLElement;
    const noDataContainer = reviewContainer.querySelector(".no-data") as HTMLElement;
    const mainDataContainer = reviewContainer.querySelector(".main-data") as HTMLElement;
    
    // Tạo container loading
    const createLoadingContainer = () => {
        const existingLoadingContainer = reviewContainer.querySelector(".loading-container");
        if (existingLoadingContainer) return existingLoadingContainer as HTMLElement;
        
        const loadingContainer = document.createElement("div");
        loadingContainer.className = "loading-container";
        loadingContainer.innerHTML = `<div class="loading-spinner"></div><div class="loading-text">Đang kiểm tra trang...</div>`;
        reviewContainer.appendChild(loadingContainer);
        return loadingContainer;
    };

    // Cập nhật giao diện dựa trên trạng thái
    const updateUI = (state: 'loading' | 'review' | 'no-review') => {
        // Ẩn tất cả container trước
        noDataContainer.classList.remove(_ACTIVE_CLASS);
        mainDataContainer.classList.remove(_ACTIVE_CLASS);
        const loadingContainer = createLoadingContainer();
        loadingContainer.classList.remove(_ACTIVE_CLASS);
        
        // Hiển thị container phù hợp
        switch (state) {
            case 'loading':
                loadingContainer.classList.add(_ACTIVE_CLASS);
                break;
            case 'review':
                mainDataContainer.classList.add(_ACTIVE_CLASS);
                break;
            case 'no-review':
                noDataContainer.classList.add(_ACTIVE_CLASS);
                break;
        }
    };

    // Render select groups từ dữ liệu
    const renderSelectGroups = () => {
        const formContainer = mainDataContainer.querySelector(".qr-options-form");
        if (!formContainer) return;
        
        // Xóa nội dung cũ
        formContainer.innerHTML = "";
        
        // Thêm các select group từ dữ liệu
        reviewSelectGroups.forEach(group => {
            const categoryDiv = document.createElement("div");
            categoryDiv.className = "qr-category";
            
            const heading = document.createElement("h5");
            heading.textContent = group.label;
            categoryDiv.appendChild(heading);
            
            const selectContainer = document.createElement("div");
            selectContainer.className = "qr-select-container";
            
            const select = document.createElement("select");
            select.id = `qr-select-${group.id}`;
            select.className = "qr-select";
            
            // Thêm các options
            group.options.forEach(option => {
                const optionElement = document.createElement("option");
                optionElement.value = option.value;
                optionElement.textContent = option.text;
                if (option.selected) {
                    optionElement.selected = true;
                }
                select.appendChild(optionElement);
            });
            
            selectContainer.appendChild(select);
            categoryDiv.appendChild(selectContainer);
            formContainer.appendChild(categoryDiv);
        });
    };

    // Kiểm tra trang hiện tại
    const checkCurrentPage = () => {
        return new Promise<boolean>((resolve) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const currentTab = tabs[0];
                const url = currentTab.url || '';

                // Kiểm tra URL có đúng định dạng không
                if (!url.includes("sis.ou.edu.vn/tienich/dggv/danhgiamh")) {
                    console.log("URL không phải trang đánh giá:", url);
                    resolve(false);
                    return;
                }

                // Kiểm tra trước xem content script đã sẵn sàng chưa
                try {
                    chrome.tabs.sendMessage(
                        currentTab.id || 0,
                        { action: "ping" },
                        (response) => {
                            // Nếu nhận được phản hồi từ ping, content script đã sẵn sàng
                            if (response && response.pong) {
                                // Bây giờ kiểm tra xem có phải trang đánh giá không
                                chrome.tabs.sendMessage(
                                    currentTab.id || 0,
                                    { action: "checkIsReviewPage" },
                                    (reviewResponse) => {
                                        if (chrome.runtime.lastError) {
                                            console.error("Error checking review page:", chrome.runtime.lastError);
                                            resolve(false);
                                        } else if (reviewResponse && reviewResponse.isReviewPage) {
                                            resolve(true);
                                        } else {
                                            resolve(false);
                                        }
                                    }
                                );
                            } else {
                                // Content script không phản hồi ping
                                console.log("Content script not ready or not loaded");
                                resolve(false);
                            }
                        }
                    );
                } catch (error) {
                    console.error("Error sending message:", error);
                    resolve(false);
                }
            });
        });
    };

    // Thực hiện tự động chọn các radio buttons 
    const autoSelectOptions = () => {
        console.log("Auto select options triggered");

        // Thu thập giá trị được chọn từ form
        const selectedValues: string[] = [];

        reviewSelectGroups.forEach(group => {
            const select = document.getElementById(`qr-select-${group.id}`) as HTMLSelectElement;
            if (select && select.value) {
                selectedValues.push(select.value);
                console.log(`Selected ${group.id}: ${select.value}`);
            }
        });

        if (selectedValues.length === 0) {
            alert('Vui lòng chọn ít nhất một giá trị!');
            return;
        }

        // Lấy giá trị checkbox tự động chuyển trang
        const autoNext = document.getElementById('qr-auto-next') as HTMLInputElement;
        const autoNextChecked = autoNext && autoNext.checked;

        // Gửi tin nhắn tới content script để thực hiện auto select
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];
            if (!currentTab || !currentTab.id) {
                console.error("No active tab found");
                alert("Không thể tìm thấy tab đang hoạt động");
                return;
            }

            console.log("Sending message to tab:", currentTab.id);
            chrome.tabs.sendMessage(
                currentTab.id,
                {
                    action: "autoSelect",
                    selectedValues: selectedValues,
                    autoNext: autoNextChecked
                },
                (response) => {
                    if (chrome.runtime.lastError) {
                        console.error("Error sending message:", chrome.runtime.lastError);
                        alert("Không thể thực hiện đánh giá nhanh. Vui lòng đảm bảo đang mở trang đánh giá.");
                    } else if (response && response.success) {
                        console.log("Auto select successful");
                    }
                }
            );
        });
    };

    // Thiết lập event listeners
    const setupEventListeners = () => {
        const runButton = reviewContainer.querySelector("#qr-run") as HTMLButtonElement;
        if (runButton) {
            // Xóa tất cả event listeners cũ để tránh trùng lặp
            runButton.removeEventListener('click', autoSelectOptions);
            // Thêm event listener mới
            runButton.addEventListener('click', autoSelectOptions);
            console.log("Added click event listener to run button");
        } else {
            console.error("Run button not found");
        }
    };

    return {
        onMount: async () => {
            console.log("QuickReview component mounted");

            // Đảm bảo tab hiển thị
            reviewContainer.classList.add(_ACTIVE_CLASS);
            
            // Hiển thị trạng thái loading
            updateUI('loading');
            
            // Render select groups từ dữ liệu
            renderSelectGroups();

            // Thiết lập event listener trước
            setupEventListeners();
            
            try {
                // Kiểm tra trang
                const isReviewPage = await checkCurrentPage();
                console.log("Is review page:", isReviewPage);
                
                // Cập nhật UI dựa trên kết quả
                updateUI(isReviewPage ? 'review' : 'no-review');
                
            } catch (error) {
                console.error("Error checking page:", error);
                updateUI('no-review');
            }
        },
        onUnmount: () => {
            console.log("QuickReview component unmounted");
            
            // Cleanup event listeners
            const runButton = reviewContainer.querySelector("#qr-run") as HTMLButtonElement;
            if (runButton) {
                runButton.removeEventListener('click', autoSelectOptions);
            }
        }
    };
};

export { QuickReview };