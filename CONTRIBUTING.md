# MPC EXTENSION - CONTRIBUTING

Below are some guidelines for contributing:

- [Report an issue](#issue)
- [Request or add a feature](#feature)
- [Contribution guide](#submit)

## <a name="issue"></a> Found a bug?

If you encounter a bug, please [open a new issue](#submit-issue) to let us know.  
Or, if you can fix it yourself, feel free to [create a pull request](#submit-pr).

## <a name="feature"></a> Adding a feature

You can request or suggest a new feature by [creating an issue](#submit-issue).  
If you would like to implement a new feature, please consider its scope to determine the appropriate next steps:

- For **major features**, please create an issue first to describe your proposal so it can be discussed.

- For **small features**, you may directly implement them and submit a [pull request](#submit-pr).

## <a name="submit"></a> Contributing

### <a name="submit-issue"></a> Creating a new issue

Before creating a new issue, please make sure it has not already been reported in existing issues.

If it is a bug, describe in detail how to reproduce the problem, and include screenshots if possible. This will help us save time when fixing it.

Unfortunately, we cannot fix issues without sufficient information. If we do not receive a response from you, the issue may be closed.

If you would like to propose a new feature, please create an issue and clearly describe your suggestion.

### <a name="submit-pr"></a> Creating a pull request (PR)

Before submitting a PR, please go through the following steps:

1. Search on [GitHub](https://github.com/mpc-ou/mpc-extension/pulls) to see if a similar PR already exists.

2. [Fork](https://docs.github.com/en/github/getting-started-with-github/fork-a-repo) this repository.

3. Create a new branch to fix the issue:

   ```shell
   git checkout -b my-fix-branch main
   ```
4. Commit your changes following the [commit message conventions](https://www.conventionalcommits.org/en/v1.0.0/). You can see examples [here](https://www.conventionalcommits.org/en/v1.0.0/#examples).

5. Push the code to GitHub:

   ```shell
   git push origin my-fix-branch
   ```
6. On GitHub, create a PR to the `main` branch of `mpc-extension`.