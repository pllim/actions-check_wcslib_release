import os
import re
import sys
from datetime import datetime, timedelta

import requests
from github import Github

repo_name = os.environ['GITHUB_REPOSITORY']
g = Github(os.environ.get('GITHUB_TOKEN'))
repo = g.get_repo(repo_name)

headers = {'user-agent': 'actions-check-wcslib-release/0.0.1'}

# Check timestamp

time_now = datetime.utcnow()
delta_days = int(os.environ.get('WCSLIB_CHECK_N_DAYS', '7'))
n_days = timedelta(days=delta_days)
time_last = time_now - n_days

changes_url = 'https://www.atnf.csiro.au/people/mcalabre/WCS/CHANGES'
r = requests.head(changes_url, headers=headers)
# Example: Wed, 12 Aug 2020 18:01:04 GMT
last_modified = datetime.strptime(
    r.headers['last-modified'], '%a, %d %b %Y %H:%M:%S %Z')

# Release was made outside window of interest, success with no-op.
if last_modified < time_last:
    print(f'Last WCSLIB release made on {last_modified.strftime("%Y-%m-%d %H:%M:%S %Z")} before {time_last.strftime("%Y-%m-%d %H:%M:%S %Z")}, nothing to do.')  # noqa
    sys.exit(0)

# Grab info from CHANGES

r_changes = requests.get(changes_url, headers=headers)
if r_changes.status_code != 200:
    print(f'Failed to download {changes_url} '
          f'({r_changes.status_code}: {r_changes.reason})')
    sys.exit(1)

changes_lines = r_changes.text.split(os.linesep)
found_ver = False
wcslib_version = 'unknown'
wcslib_reldate = '(unknown)'
latest_change_lines = []
for line in changes_lines:
    if line.startswith('WCSLIB version'):
        if found_ver:
            break
        else:
            found_ver = True
            words = line.split()
            wcslib_version = words[2]
            wcslib_reldate = words[3]
            latest_change_lines.append(line)
    elif found_ver:
        latest_change_lines.append(line)

change_log = os.linesep.join(latest_change_lines)

# Open issue

issue_title = f'ANN: New WCSLIB {wcslib_version} released'
issue_body = f"""New WCSLIB release found.

Version: {wcslib_version} {wcslib_reldate}

#### Change log

{change_log}

(For complete change log information, see {changes_url} .)
"""

repo.create_issue(title=issue_title, body=issue_body)

print(issue_title)
print()
print(issue_body)
