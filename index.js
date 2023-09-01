#!/usr/bin/env node

const { exec } = require("child_process");
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const execute = (command) => {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                return reject(`Error executing command: ${error}`);
            }
            resolve(stdout);
        });
    });
};

const question = (query) => {
    return new Promise((resolve) => {
        rl.question(query, (answer) => {
            resolve(answer);
        });
    });
};

const commandExists = (command) => {
    return execute(`which ${command}`)
        .then(stdout => !!stdout.trim())
        .catch(() => false);
};

const main = async () => {
    try {
        const name = await question("Enter your name: ");
        const email = await question("Enter your email: ");
        const username = await question("Enter your username: ");
        const orgName = await question("Enter the organization name: ");

        const datetime = new Date().toISOString().replace(/[:.-]/g, "");
        const repoName = `${orgName}-${username}-test-${datetime}`;

        await execute(`git config --global user.name "${name}"`);
        await execute(`git config --global user.email "${email}"`);

        const exists = await commandExists('gh');

        if (!exists) {
            console.log('GitHub CLI not found. Installing...');
            // Your installation script here...
            await execute(`
            type -p curl >/dev/null || (sudo apt update && sudo apt install curl -y);
            curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg;
            sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg;
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null;
            sudo apt update;
            sudo apt install gh -y
          `, () => {
                console.log("Installed GitHub CLI");
                // Continue with the rest of your code...
            });
            console.log("Installed GitHub CLI");
        } else {
            console.log("GitHub CLI already installed.");
        }

        const authStatus = await execute("gh auth status");

        if (authStatus.includes("Logged in to github.com")) {
            console.log("Already logged in to GitHub.");
        } else {
            console.log("Not logged in to GitHub. Running `gh auth login`...");
            await execute("gh auth login");
            console.log("Logged in to GitHub.");
        }

        console.log(`Creating repo ${repoName}`);
        await execute(`gh repo create ${orgName}/${repoName} --public`);
        console.log("Created repository");

        await execute(`git clone https://github.com/${orgName}/${repoName}.git`);
        console.log("Cloned repository");

        await execute(`mv ${repoName}/.git .`);
        console.log("Moved .git folder")

        await execute(`rmdir ${repoName}`);
        console.log("Removed empty directory");

        await execute("echo '# Test file' > test.MD");
        console.log("Created test.MD");

        await execute("git add .");
        console.log("Staged changes");

        await execute('git commit -m "Test commit"');
        console.log("Committed changes");

        await execute("git push");
        console.log("Pushed changes");

        await execute(`gh repo delete ${orgName}/${repoName} --yes`);
        console.log("Deleted repository");
        
        console.log("Done!");

        rl.close();
    } catch (error) {
        console.error(error);
        rl.close();
    }
};

main();
