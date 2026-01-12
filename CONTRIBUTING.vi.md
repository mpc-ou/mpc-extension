# MPC EXTENSION - ĐÓNG GÓP MÃ NGUỒN

Dưới đây là một số hướng dẫn cho bạn:

- [Phát hiện lỗi](#issue)
- [Thêm tính năng](#feature)
- [Hướng dẫn đóng góp mã nguồn](#submit)

## <a name="issue"></a> Phát hiện lỗi?

Nếu gặp lỗi hãy [tạo mới một issue](#submit-issue) để thông báo cho chúng tôi.
Hoặc nếu bạn có thể fix chúng, đừng ngần ngại [tạo pull request](#submit-pr).

## <a name="feature"></a> Thêm tính năng

Bạn có thể yêu cầu, gợi ý một tính năng mới thông qua [tạo issue](#submit-issue).
Nếu muốn thực hiện một tính năng mới, hãy xem xét độ thay đổi của chúng để xác định cách bước tiếp theo phù hợp:

- Đối với **tính năng chính (Major Features)**, trước hết hãy tạo một issue, đề cập về đề xuất của bạn để chúng được thảo luận.

- Với các **tính năng nhỏ (Small Features)** có thể được tạo và gửi thông qua [tạo pull request](#submit-pr).

## <a name="submit"></a> Đóng góp mã nguồn

### <a name="submit-issue"></a> Tạo mới một issue

Trước khi tạo một issue mới, hãy chắc chắn chúng chưa được đề cập trước đó trong các issue đã tồn tại.

Nếu đó là một lỗi, hãy mô tả chi tiết về quá trình bạn gặp lỗi, nếu được hãy đính kèm hình ảnh. Chúng sẽ giúp chúng tôi tiết kiệm thời gian hơn trong việc sửa lỗi.

Rất tiếc, chúng tôi không thể sửa các lỗi mà không có phần mô tả. Vì vậy nếu chúng tôi không nhận được phản hồi từ bạn, chúng tôi sẽ đóng issue đó.

Trong trường hợp bạn muốn đề xuất một tính năng mới, hãy tạo issue và mô tả về đề xuất của bạn.

### <a name="submit-pr"></a> Tạo pull request (PR)

Trước khi gửi PR, hãy đọc qua các bước dưới đây:

1. Tìm kiếm trên [GitHub](https://github.com/mpc-ou/mpc-extension/pulls) xem đã có PR nào trước đó tương tự hay chưa.

2. [Fork](https://docs.github.com/en/github/getting-started-with-github/fork-a-repo) repo này về máy.

3. Tạo một nhánh mới để fix lỗi:

   ```shell
   git checkout -b my-fix-branch main
   ```

4. Commit các thay đổi theo quy tắc [commit message conventions](https://www.conventionalcommits.org/en/v1.0.0/), bạn có thể xem các ví dụ tại [đây](https://github.com/mpc-ou/mpc-extension/commits/main/).

5. Đưa code lên github:

   ```shell
   git push origin my-fix-branch
   ```

6. Trên GitHub, tạo một PR đến nhánh `main` của `mpc-extension`.
