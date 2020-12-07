# GitHub Action to open issue on new WCSLIB release

Open a GitHub issue if WCSLIB has a new release in the past
`WCSLIB_CHECK_N_DAYS` (default is 7 days). This Action should run
on schedule only every `WCSLIB_CHECK_N_DAYS` days or it is going
to open duplicate issues.

Create a `.github/workflows/check_wcslib_release.yml` with this:

```
name: Check WCSLIB release

on:
  schedule:
    # Weekly Monday 6 AM build.
    # * is a special character in YAML so you have to quote this string.
    - cron: '0 6 * * 1'

jobs:
  check_wcslib:
    name: Open issue if new release found
    runs-on: ubuntu-latest
    steps:
    - name: Check release
      uses: pllim/actions-check_wcslib_release@main
      env:
        WCSLIB_CHECK_N_DAYS: 7
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

```
