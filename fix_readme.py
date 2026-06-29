import os
import re

base_dir = r'd:\My Projects\Stellar ALL Projects'
projects = [
    ('01-vesta-payroll', 'Vesta Payroll', 'CC1VESTAPAYROLL...', 'level1_vesta_payroll.png', 'level2_transaction_vesta_payroll.png'),
    ('02-splitwise-web3', 'Splitwise Web3', 'CC2SPLITWISE...', 'level1_splitwise_web3.png', 'level2_transaction_splitwise_web3.png'),
    ('03-autodca', 'AutoDCA', 'CC3AUTODCA...', 'level1_autodca.png', 'level2_transaction_autodca.png'),
    ('04-milestone-crowdfund', 'Milestone Crowdfund', 'CC4MILESTONE...', 'level1_milestone_crowdfund.png', 'level2_transaction_milestone_crowdfund.png'),
    ('05-directremit', 'DirectRemit', 'CC5DIRECTREMIT...', 'level1_directremit.png', 'level2_transaction_directremit.png'),
    ('06-anchorstream', 'AnchorStream', 'CC6ANCHORSTREAM...', 'level1_anchorstream.png', 'level2_transaction_anchorstream.png'),
    ('07-safekeep', 'SafeKeep', 'CC7SAFEKEEP...', 'level1_safekeep.png', 'level2_transaction_safekeep.png'),
    ('08-kidvault', 'KidVault', 'CC8KIDVAULT...', 'level1_kidvault.png', 'level2_transaction_kidvault.png'),
    ('09-teamvault', 'TeamVault', 'CC9TEAMVAULT...', 'level1_teamvault.png', 'level2_transaction_teamvault.png')
]

for project, name, addr, l1_img, l2_img in projects:
    readme_path = os.path.join(base_dir, project, 'README.md')
    if not os.path.exists(readme_path):
        continue
    
    with open(readme_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix mermaid backticks (convert `mermaid or ``mermaid to ```mermaid)
    content = re.sub(r'`+mermaid', '```mermaid', content)
    # Fix closing backticks for the mermaid block
    # It might be ` or `` before ---
    content = re.sub(r'(\n)[\`]{1,2}(\n\n---)', r'\1```\2', content)

    # Fix the verification details backticks missing around the addresses
    content = re.sub(r'\*\*Deployed Contract Address:\*\* ([A-Z0-9\.]+)\n', r'**Deployed Contract Address:** `\1`\n', content)
    content = re.sub(r'\*\*Transaction Hash \(Stellar Explorer\):\*\* ([a-f0-9]+)\n', r'**Transaction Hash (Stellar Explorer):** `\1`\n', content)

    with open(readme_path, 'w', encoding='utf-8') as f:
        f.write(content)

print('Markdown fixes applied!')
