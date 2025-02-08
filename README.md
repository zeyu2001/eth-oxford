# CodeCure

This is a submission for the ETH Oxford 2025 hackathon.

CodeCure is an AI-powered static code analysis platform that helps developers write more secure code. Install the CodeCure GitHub integration, and we will automatically scan your code for security vulnerabilities and submit pull requests with fixes.

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## Features

- Automatic code scanning for a wide range of security vulnerabilities
- Automatic pull requests with fixes
- Insights and reports on issues found across your repositories
- Vulnerability information is stored securely on the blockchain using the [Flare Data Connector](https://flare.network/dataconnector/),
  providing a tamper-proof audit trail

The FDC uses a set of indepdenent attestation providers which fetch the information from Web2 APIs and deliver it to the Flare Network.
The data proofs confirm that a vulnerability was found in a specific repository at a specific time.
