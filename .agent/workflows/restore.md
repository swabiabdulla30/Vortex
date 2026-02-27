---
description: Revert the website to the stable GOLDEN checkpoint
---

If the user asks to "Restore", "Reset", or says "GOLDEN", follow these steps:

1. Use the `run_command` tool to execute:
```powershell
git reset --hard GOLDEN
git clean -fd
```
2. Notify the user that the system has been reverted to the stable state.
