// Lắng nghe tin nhắn từ popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Received message:", message);
    
    if (message.action === "ping") {
        sendResponse({pong: true});
        // KHÔNG return true vì đã phản hồi đồng bộ
        return false;
    }
    
    if (message.action === "autoSelect") {
        const textArr = message.selectedValues;
        // Xử lý autoSelect đồng bộ
        autoSelectOptions(textArr, message.autoNext);
        sendResponse({success: true});
        return false;
    } 
    
    if (message.action === "checkIsReviewPage") {
        // Kiểm tra xem trang hiện tại có phải là trang đánh giá không
        const isReviewPage = document.querySelectorAll('.list-group-item').length > 0;
        sendResponse({isReviewPage: isReviewPage});
        return false;
    }
    
    // Trường hợp không khớp với bất kỳ action nào
    sendResponse({error: "Unknown action"});
    return false;// Giữ kênh kết nối mở cho phản hồi bất đồng bộ
});

// Hàm thực hiện auto select
function autoSelectOptions(textArr, autoNext) {
    if (!textArr || textArr.length === 0) {
        console.log("Không có lựa chọn nào được chọn");
        return;
    }
    
    console.log("Các giá trị sẽ được chọn:", textArr);
    
    // Thực hiện auto select theo cách của user
    const list = document.querySelectorAll('.list-group-item');
    list.forEach((item) => {
        if (!item.classList.contains('bg-light')) {
            const subList = item.querySelectorAll('div:last-child > div');
            subList.forEach((subItem) => {
                const subItemText = subItem.innerText.trim();
                if (textArr.includes(subItemText)) {
                    const radioInput = subItem.querySelector('input[type="radio"]');
                    if (radioInput) {
                        radioInput.click();
                        console.log("Đã chọn:", subItemText);
                    }
                }
            });
        }
    });
    
    // Nếu đã chọn auto next, tự động click vào nút Tiếp tục liên tục với delay 5s
    if (autoNext) {
        console.log("Bắt đầu tự động chuyển trang...");
        
        // Hàm kiểm tra và click nút Next
        const clickNextButton = () => {
            const nextButton = document.querySelector('#dggv_form > div.row.mt-5 > div > button.btn-primary');
            
            if (nextButton) {
                console.log("Đã tìm thấy nút Next, đang click...");
                nextButton.click();
                
                // Đợi 5 giây và kiểm tra lại
                setTimeout(() => {
                    // Auto select trước khi click next button ở trang tiếp theo
                    const newList = document.querySelectorAll('.list-group-item');
                    if (newList.length > 0) {
                        // Thực hiện auto select lại trên trang mới
                        autoSelectOptions(textArr, false); // Không đệ quy autoNext
                        
                        // Sau khi chọn xong, tiếp tục loop click next
                        setTimeout(clickNextButton, 500);
                    } else {
                        // Nếu không có danh sách câu hỏi, kiểm tra nút next
                        clickNextButton();
                    }
                }, 5000);
            } else {
                console.log("Không tìm thấy nút Next nữa, quá trình tự động kết thúc");
            }
        };
        
        // Bắt đầu quy trình click sau 500ms đầu tiên
        setTimeout(clickNextButton, 500);
    }
}

