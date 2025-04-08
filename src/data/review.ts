export interface SelectOption {
    value: string;
    text: string;
    selected?: boolean;
}

export interface SelectGroup {
    id: string;
    label: string;
    options: SelectOption[];
}

export const reviewSelectGroups: SelectGroup[] = [
    {
        id: "agree",
        label: "Mức độ đồng ý",
        options: [
            { value: "", text: "Chọn giá trị..." },
            { value: "Hoàn toàn không đồng ý", text: "Hoàn toàn không đồng ý" },
            { value: "Không đồng ý", text: "Không đồng ý" },
            { value: "Bình thường", text: "Bình thường" },
            { value: "Đồng ý", text: "Đồng ý" },
            { value: "Hoàn toàn đồng ý", text: "Hoàn toàn đồng ý", selected: true }
        ]
    },
    {
        id: "self-study-time",
        label: "Thời gian tự học",
        options: [
            { value: "", text: "Chọn giá trị..." },
            { value: "Dưới 40 giờ", text: "Dưới 40 giờ" },
            { value: "40 giờ đến dưới 65 giờ", text: "40 giờ đến dưới 65 giờ" },
            { value: "65 giờ đến dưới 90 giờ", text: "65 giờ đến dưới 90 giờ" },
            { value: "90 giờ đến dưới 110 giờ", text: "90 giờ đến dưới 110 giờ", selected: true },
            { value: "Từ 110 giờ trở lên", text: "Từ 110 giờ trở lên" }
        ]
    },
    {
        id: "satisfaction",
        label: "Mức độ hài lòng",
        options: [
            { value: "", text: "Chọn giá trị..." },
            { value: "Rất không hài lòng", text: "Rất không hài lòng" },
            { value: "Không hài lòng", text: "Không hài lòng" },
            { value: "Phân vân", text: "Phân vân" },
            { value: "Hài lòng", text: "Hài lòng" },
            { value: "Rất hài lòng", text: "Rất hài lòng", selected: true }
        ]
    },
    {
        id: "times",
        label: "Số lần",
        options: [
            { value: "", text: "Chọn giá trị..." },
            { value: "Khoảng gấp 2 lần", text: "Khoảng gấp 2 lần", selected: true }
        ]
    }
];

// // Danh sách các giá trị để sử dụng trong auto select
// export const selectableValues = {
//     agree: ["Hoàn toàn không đồng ý", "Không đồng ý", "Bình thường", "Đồng ý", "Hoàn toàn đồng ý"],
//     "self-study-time": ["Dưới 40 giờ", "40 giờ đến dưới 65 giờ", "65 giờ đến dưới 90 giờ", "90 giờ đến dưới 110 giờ", "Từ 110 giờ trở lên"],
//     satisfaction: ["Rất không hài lòng", "Không hài lòng", "Phân vân", "Hài lòng", "Rất hài lòng"],
//     times: ["Khoảng gấp 2 lần"]
// };