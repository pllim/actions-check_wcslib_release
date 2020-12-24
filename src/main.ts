import * as core from "@actions/core";
import * as github from "@actions/github";

async function run() {
    try {
        const fetch = require("node-fetch");

        const n_days_input = core.getInput("WCSLIB_CHECK_N_DAYS", { required: false });
        const n_days_ms = Number(n_days_input) * 24 * 60 * 60 * 1000;  // ms
        const now = new Date().getTime();
        const n_days_ago = now - n_days_ms;

        const headers = {'user-agent': 'actions-check_wcslib_release/0.2.0'}
        const changes_url = 'https://www.atnf.csiro.au/people/mcalabre/WCS/CHANGES';
        const response_changes = await fetch(changes_url, {headers: headers});
        const last_modified = new Date(response_changes.headers.get('last-modified'));

        if (last_modified.getTime() < n_days_ago) {
            core.info(`Last WCSLIB release made on ${last_modified.toISOString()} before ${new Date(n_days_ago).toISOString()}, nothing to do.`);
            return;
        }

        const gh_token = core.getInput("GITHUB_TOKEN", { required: true });
        const octokit = github.getOctokit(gh_token);

        const changes_content = await response_changes.text();
        const changes_lines = changes_content.split("\n");
        let found_ver:boolean = false;
        let wcslib_version:string = 'unknown';
        let wcslib_reldate:string = '(unknown)';
        const latest_change_lines:Array<string> = [];
        for (let i = 0; i < changes_lines.length; i++) {
            let line:string = changes_lines[i];
            if (line.startsWith('WCSLIB version')) {
                if (found_ver) {
                    break;
                } else {
                    found_ver = true;
                    let words = line.split(/\s+/);
                    wcslib_version = words[2];
                    wcslib_reldate = words[3];
                    latest_change_lines.push(line);
                }
            } else if (found_ver) {
                latest_change_lines.push(line);
            }
        }

        const change_log = latest_change_lines.join("\n");
        const issue_title = `ANN: New WCSLIB ${wcslib_version} released`;
        const issue_body = `New WCSLIB release found.

Version: ${wcslib_version} ${wcslib_reldate}

#### Change log

${change_log}

(For complete change log information, see ${changes_url} .)`;

        core.info(`${issue_title}\n\n${issue_body}`);
        octokit.issues.create({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            title: issue_title,
            body: issue_body
        });
    } catch(err) {
        core.setFailed(`Action failed with error ${err}`);
    }
}

run();
