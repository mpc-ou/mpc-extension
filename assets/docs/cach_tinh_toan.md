# Cách tính toán — MPC Extension

Tài liệu mô tả toàn bộ logic tính điểm, xếp loại và cảnh báo.
Các giá trị **{{in đậm gạch dưới}}** là tham số động — có thể thay đổi trong Cài đặt.

---

## 1. GPA từng học kỳ

Cho một học kỳ, chỉ tính các môn **không bị loại** (`isIgnore = false`) và có ký tự điểm hợp lệ (A+, A, B+, B, C+, C, D+, D, F).

```
sum10 = Σ (điểm_hệ_10 × tín_chỉ)
sum4  = Σ (điểm_hệ_4  × tín_chỉ)
total = Σ tín_chỉ

GPA_10 = sum10 / total
GPA_4  = sum4  / total
```

Môn bị loại: GDTC, GDQP, BHYT, Sinh hoạt lớp, Tiếng Anh căn bản, Kiểm tra đầu vào…

---

## 2. GPA tích lũy (toàn khóa)

Tính như trên nhưng gộp tất cả học kỳ từ kỳ 1 đến kỳ hiện tại.

---

## 3. Xếp loại học lực

Dựa trên GPA hệ 4 tích lũy, so với các ngưỡng sau:

| GPA ≥ | Xếp loại |
|-------|----------|
| {{EXCELLENT_GPA}} | Xuất sắc |
| {{GOOD_GPA}} | Giỏi |
| {{FAIR_GPA}} | Khá |
| {{AVERAGE_GPA}} | Trung bình |
| < {{AVERAGE_GPA}} | Yếu |

---

## 4. Điểm rèn luyện (ĐRL)

### 4.1 ĐRL trung bình

Chỉ lấy **{{TRAINING_SEMESTERS}}** học kỳ đầu tiên (mới nhất) có điểm ĐRL:

```
avgTraining = Σ(ĐRL kỳ i) / số kỳ được tính
```

### 4.2 Xếp loại ĐRL

| ĐRL ≥ | Xếp loại |
|-------|----------|
| {{EXCELLENT_DRL}} | Xuất sắc |
| {{GOOD_DRL}} | Tốt |
| {{FAIR_DRL}} | Khá |
| {{AVERAGE_DRL}} | Trung bình |
| {{LOW_DRL_WARN}} | Trung bình kém |
| {{LOW_DRL}} | Kém |
| < {{LOW_DRL}} | Yếu |

### 4.3 Cảnh báo ĐRL

Nếu có **≥ 2 học kỳ liên tiếp** ĐRL < **{{WARNING_SCORE}}**:

⚠ **Nguy cơ khóa MSSV** — sinh viên có thể bị tạm dừng học 1 kỳ.

---

## 5. Tín chỉ

### 5.1 Tổng tín chỉ tích lũy

Tổng tín chỉ các môn **không bị loại**, có điểm chữ hợp lệ.

### 5.2 Tín chỉ còn lại

```
remainingCredits = TOTAL_PROGRAM_CREDITS - tổng_tín_chỉ_tích_lũy
```

{{TOTAL_PROGRAM_CREDITS}} tín chỉ (cấu hình cá nhân, tổng tín chỉ CTĐT).

### 5.3 Tín chỉ cho phép đăng ký mỗi học kỳ

| Học lực kỳ trước | Tối đa |
|------------------|--------|
| ≥ {{AVERAGE_GPA}} (bình thường) | {{MAX_CREDITS_PER_SEMESTER}} |
| < {{AVERAGE_GPA}} (cảnh báo học vụ) | {{MAX_CREDITS_WARNING}} |
| Học kỳ hè | {{MAX_CREDITS_SUMMER}} |

Tối thiểu luôn: {{MIN_CREDITS_PER_SEMESTER}} (trừ kỳ cuối).

---

## 6. Học lại & Nguy cơ hạ bằng

### 6.1 Tín chỉ học lại (bị điểm F)

```
retakeCredits = Σ tín_chỉ các môn có điểm F (không bị loại)
```

### 6.2 Ngưỡng an toàn

Quy chế: nếu tín chỉ học lại vượt quá **{{RETAKE_RATIO_LIMIT}}** × tổng tín chỉ chương trình → hạ 1 bậc bằng tốt nghiệp.

```
ratio = retakeCredits / TOTAL_PROGRAM_CREDITS

nếu ratio ≥ RETAKE_RATIO_LIMIT           → DANGER (bị hạ bằng)
nếu ratio ≥ RETAKE_RATIO_LIMIT × 0.8     → WARNING (cận ngưỡng)
còn lại                                   → SAFE
```

{{TOTAL_PROGRAM_CREDITS}} tín chỉ chương trình (cấu hình cá nhân).

---

## 7. Dự đoán GPA tối đa

Giả định tất cả tín chỉ còn lại đạt điểm A+ (4.0):

```
maxGPA = (gpa4 × currentCredit + 4.0 × remainingCredits) / TOTAL_PROGRAM_CREDITS
```

---

## 8. Quy đổi điểm

Điểm hệ 10 → Điểm chữ → Điểm hệ 4

| Hệ 10 ≥ | Chữ | Hệ 4 |
|---------|-----|------|
| {{POINT_A_PLUS}} | A+ | 4.0 |
| {{POINT_A}} | A | 4.0 |
| {{POINT_B_PLUS}} | B+ | 3.5 |
| {{POINT_B}} | B | 3.0 |
| {{POINT_C_PLUS}} | C+ | 2.5 |
| {{POINT_C}} | C | 2.0 |
| {{POINT_D_PLUS}} | D+ | 1.5 |
| {{POINT_D}} | D | 1.0 |
| < {{POINT_D}} | F | 0.0 |

---

## 9. Danh sách tham số

### Tham số toàn trường

| Tên code | Mặc định | Ý nghĩa |
|----------|----------|---------|
| `EXCELLENT_GPA` | {{EXCELLENT_GPA}} | Ngưỡng Xuất sắc |
| `GOOD_GPA` | {{GOOD_GPA}} | Ngưỡng Giỏi |
| `FAIR_GPA` | {{FAIR_GPA}} | Ngưỡng Khá |
| `AVERAGE_GPA` | {{AVERAGE_GPA}} | Ngưỡng Trung bình |
| `WARNING_SCORE` | {{WARNING_SCORE}} | Ngưỡng ĐRL cảnh báo |
| `RETAKE_RATIO_LIMIT` | {{RETAKE_RATIO_LIMIT}} | Tỉ lệ tín chỉ học lại tối đa |
| `MAX_CREDITS_PER_SEMESTER` | {{MAX_CREDITS_PER_SEMESTER}} | TC tối đa/kỳ chính |
| `MIN_CREDITS_PER_SEMESTER` | {{MIN_CREDITS_PER_SEMESTER}} | TC tối thiểu/kỳ chính |
| `MAX_CREDITS_WARNING` | {{MAX_CREDITS_WARNING}} | TC tối đa khi bị cảnh báo |
| `MAX_CREDITS_SUMMER` | {{MAX_CREDITS_SUMMER}} | TC tối đa/kỳ hè |

### Tham số cá nhân

| Tên code | Mặc định | Ý nghĩa |
|----------|----------|---------|
| `TRAINING_SEMESTERS` | {{TRAINING_SEMESTERS}} | Số kỳ đầu tính ĐRL |
| `TOTAL_PROGRAM_CREDITS` | {{TOTAL_PROGRAM_CREDITS}} | Tổng tín chỉ CTĐT |
