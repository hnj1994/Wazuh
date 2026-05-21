import type {
  Agent,
  Alert,
  ChartPoint,
  DashboardMetric,
  HuntQuery,
  HuntResult,
  Incident,
  MitreTechnique,
  SocReport,
  SocUser,
  SoarPlaybook,
  Tenant,
  ThreatIntelIndicator
} from "@/types";

const iso = (hoursAgo: number) => new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

export const tenants: Tenant[] = [
  { id: "apex", name: "Apex Financial", plan: "enterprise", region: "us-east", retentionDays: 365 },
  { id: "nova", name: "Nova Health", plan: "enterprise", region: "us-central", retentionDays: 180 },
  { id: "mssp-lab", name: "MSSP Lab", plan: "mssp", region: "eu-west", retentionDays: 90 }
];

export const users: SocUser[] = [
  {
    id: "u-001",
    name: "Maya Chen",
    email: "admin@soc.local",
    role: "soc_manager",
    tenantIds: ["apex", "nova", "mssp-lab"]
  },
  {
    id: "u-002",
    name: "Arjun Rao",
    email: "analyst@soc.local",
    role: "tier_2",
    tenantIds: ["apex", "nova"]
  },
  {
    id: "u-003",
    name: "Sam Rivera",
    email: "viewer@soc.local",
    role: "viewer",
    tenantIds: ["apex"]
  }
];

export const demoCredentials: Record<string, string> = {
  "admin@soc.local": "admin123",
  "analyst@soc.local": "analyst123",
  "viewer@soc.local": "viewer123"
};

export const agents: Agent[] = [
  {
    id: "001",
    tenantId: "apex",
    name: "dc-01",
    ip: "10.10.1.10",
    os: "Windows Server 2022",
    version: "4.9.2",
    status: "active",
    group: "domain-controllers",
    lastSeen: iso(0.03),
    cpu: 61,
    memory: 72,
    alertCount24h: 42
  },
  {
    id: "002",
    tenantId: "apex",
    name: "fin-vdi-044",
    ip: "10.10.34.44",
    os: "Windows 11 Enterprise",
    version: "4.9.2",
    status: "active",
    group: "workstations",
    lastSeen: iso(0.2),
    cpu: 38,
    memory: 59,
    alertCount24h: 27
  },
  {
    id: "003",
    tenantId: "apex",
    name: "payroll-api-02",
    ip: "10.10.8.23",
    os: "Ubuntu 22.04",
    version: "4.8.1",
    status: "active",
    group: "linux-servers",
    lastSeen: iso(0.1),
    cpu: 44,
    memory: 64,
    alertCount24h: 18
  },
  {
    id: "004",
    tenantId: "apex",
    name: "vpn-gw-01",
    ip: "10.10.2.5",
    os: "Ubuntu 20.04",
    version: "4.9.0",
    status: "active",
    group: "network",
    lastSeen: iso(0.05),
    cpu: 26,
    memory: 41,
    alertCount24h: 33
  },
  {
    id: "005",
    tenantId: "apex",
    name: "build-runner-07",
    ip: "10.10.16.77",
    os: "Debian 12",
    version: "4.7.5",
    status: "disconnected",
    group: "ci-cd",
    lastSeen: iso(9.5),
    cpu: 0,
    memory: 0,
    alertCount24h: 11
  },
  {
    id: "006",
    tenantId: "nova",
    name: "ehr-db-01",
    ip: "10.20.4.12",
    os: "Ubuntu 22.04",
    version: "4.9.2",
    status: "active",
    group: "database",
    lastSeen: iso(0.08),
    cpu: 57,
    memory: 79,
    alertCount24h: 21
  }
];

export const alerts: Alert[] = [
  {
    id: "WAZUH-10031",
    tenantId: "apex",
    timestamp: iso(0.15),
    severity: "critical",
    status: "new",
    riskScore: 96,
    rule: {
      id: "5715",
      level: 15,
      description: "Multiple authentication failures followed by successful login",
      groups: ["authentication_failed", "pci_dss_10.2.4", "gdpr_IV_32.2"]
    },
    agent: { id: "001", name: "dc-01", ip: "10.10.1.10", os: "Windows Server 2022" },
    source: { ip: "185.244.25.18", port: 51584, geo: "NL", user: "svc_backup" },
    destination: { ip: "10.10.1.10", port: 3389, host: "dc-01" },
    decoder: "windows_eventchannel",
    location: "EventChannel",
    fullLog:
      "4625 failed logon attempts for svc_backup from 185.244.25.18 followed by 4624 Type 10 remote interactive logon.",
    mitre: [
      {
        tactic: "Credential Access",
        tacticId: "TA0006",
        technique: "Brute Force",
        techniqueId: "T1110",
        confidence: 94
      },
      {
        tactic: "Initial Access",
        tacticId: "TA0001",
        technique: "External Remote Services",
        techniqueId: "T1133",
        confidence: 82
      }
    ],
    tags: ["rdp", "bruteforce", "identity"],
    aiSummary:
      "Likely credential stuffing against a privileged service account with successful RDP access after repeated failures.",
    raw: { win: { event_id: 4625, logon_type: 10 }, opensearch_index: "wazuh-alerts-4.x-2026.05.20" }
  },
  {
    id: "WAZUH-10032",
    tenantId: "apex",
    timestamp: iso(0.55),
    severity: "high",
    status: "triage",
    riskScore: 88,
    rule: {
      id: "92032",
      level: 13,
      description: "Suspicious PowerShell encoded command execution",
      groups: ["windows", "powershell", "execution"]
    },
    agent: { id: "002", name: "fin-vdi-044", ip: "10.10.34.44", os: "Windows 11 Enterprise" },
    source: { user: "CORP\\jmorales" },
    process: {
      name: "powershell.exe",
      pid: 5920,
      parent: "WINWORD.EXE",
      commandLine:
        "powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand SQBFAFgAKABOAGUAdwAtAE8AYgBqAGUAYwB0AA==",
      hash: "0e7f1b928d5140f8a32b7bfe93d2cdd2"
    },
    decoder: "sysmon",
    location: "Microsoft-Windows-Sysmon/Operational",
    fullLog:
      "Sysmon Event ID 1: WINWORD.EXE spawned powershell.exe with encoded command and bypassed execution policy.",
    mitre: [
      {
        tactic: "Execution",
        tacticId: "TA0002",
        technique: "Command and Scripting Interpreter: PowerShell",
        techniqueId: "T1059.001",
        confidence: 97
      }
    ],
    tags: ["powershell", "macro", "lolbin"],
    aiSummary:
      "Office child process launched encoded PowerShell. Treat as probable phishing payload execution until proven benign.",
    raw: { sysmon: { event_id: 1, parent_image: "WINWORD.EXE" } }
  },
  {
    id: "WAZUH-10033",
    tenantId: "apex",
    timestamp: iso(1.1),
    severity: "high",
    status: "investigating",
    riskScore: 84,
    rule: {
      id: "553",
      level: 12,
      description: "File integrity monitoring detected web shell-like PHP drop",
      groups: ["fim", "web", "malware"]
    },
    agent: { id: "003", name: "payroll-api-02", ip: "10.10.8.23", os: "Ubuntu 22.04" },
    source: { user: "www-data" },
    process: {
      name: "php-fpm",
      pid: 2401,
      commandLine: "/usr/sbin/php-fpm8.1 --nodaemonize"
    },
    decoder: "ossec",
    location: "/var/ossec/logs/alerts/alerts.json",
    fullLog: "FIM: new file /var/www/payroll/public/uploads/.cache.php contains suspicious eval and base64_decode usage.",
    mitre: [
      {
        tactic: "Persistence",
        tacticId: "TA0003",
        technique: "Server Software Component: Web Shell",
        techniqueId: "T1505.003",
        confidence: 91
      }
    ],
    tags: ["fim", "webshell", "linux"],
    aiSummary:
      "A hidden PHP file with common web shell primitives appeared in upload storage. Isolate app host and preserve artifact.",
    raw: { fim: { path: "/var/www/payroll/public/uploads/.cache.php", action: "added" } }
  },
  {
    id: "WAZUH-10034",
    tenantId: "apex",
    timestamp: iso(1.8),
    severity: "medium",
    status: "new",
    riskScore: 63,
    rule: {
      id: "31151",
      level: 10,
      description: "SQL injection attempt detected by web log rule",
      groups: ["web", "attack", "sql_injection"]
    },
    agent: { id: "003", name: "payroll-api-02", ip: "10.10.8.23", os: "Ubuntu 22.04" },
    source: { ip: "203.0.113.9", geo: "US" },
    destination: { ip: "10.10.8.23", port: 443, host: "payroll-api-02" },
    decoder: "apache-accesslog",
    location: "/var/log/nginx/access.log",
    fullLog: "GET /api/employee?id=1%27%20OR%20%271%27=%271 returned HTTP 403 via WAF.",
    mitre: [
      {
        tactic: "Initial Access",
        tacticId: "TA0001",
        technique: "Exploit Public-Facing Application",
        techniqueId: "T1190",
        confidence: 74
      }
    ],
    tags: ["web", "waf", "sqli"],
    raw: { http: { method: "GET", status: 403, uri: "/api/employee" } }
  },
  {
    id: "WAZUH-10035",
    tenantId: "apex",
    timestamp: iso(2.6),
    severity: "medium",
    status: "triage",
    riskScore: 58,
    rule: {
      id: "60122",
      level: 9,
      description: "Malware signature detected by Windows Defender",
      groups: ["malware", "windows_defender"]
    },
    agent: { id: "002", name: "fin-vdi-044", ip: "10.10.34.44", os: "Windows 11 Enterprise" },
    source: { user: "CORP\\jmorales" },
    process: { name: "MsMpEng.exe" },
    decoder: "windows_eventchannel",
    location: "Microsoft-Windows-Windows Defender/Operational",
    fullLog: "Defender detected Trojan:Win32/PhishLoader.A in Downloads\\invoice_q2.xlsm and quarantined it.",
    mitre: [
      {
        tactic: "Execution",
        tacticId: "TA0002",
        technique: "User Execution: Malicious File",
        techniqueId: "T1204.002",
        confidence: 88
      }
    ],
    tags: ["malware", "phishing", "quarantined"],
    raw: { defender: { threat: "Trojan:Win32/PhishLoader.A", action: "quarantined" } }
  },
  {
    id: "WAZUH-10036",
    tenantId: "apex",
    timestamp: iso(4.2),
    severity: "low",
    status: "resolved",
    riskScore: 32,
    rule: {
      id: "5502",
      level: 5,
      description: "User sudo command executed",
      groups: ["syslog", "privilege_escalation"]
    },
    agent: { id: "003", name: "payroll-api-02", ip: "10.10.8.23", os: "Ubuntu 22.04" },
    source: { user: "deploy" },
    process: { name: "sudo", commandLine: "sudo systemctl restart payroll-api" },
    decoder: "sudo",
    location: "/var/log/auth.log",
    fullLog: "deploy : TTY=pts/2 ; PWD=/srv/payroll ; USER=root ; COMMAND=/bin/systemctl restart payroll-api",
    mitre: [
      {
        tactic: "Privilege Escalation",
        tacticId: "TA0004",
        technique: "Valid Accounts",
        techniqueId: "T1078",
        confidence: 42
      }
    ],
    tags: ["sudo", "change-window"],
    raw: { change_ticket: "CHG-8451" }
  },
  {
    id: "WAZUH-10037",
    tenantId: "apex",
    timestamp: iso(5.7),
    severity: "high",
    status: "new",
    riskScore: 81,
    rule: {
      id: "87103",
      level: 12,
      description: "Possible data exfiltration over unusual destination port",
      groups: ["network", "exfiltration"]
    },
    agent: { id: "004", name: "vpn-gw-01", ip: "10.10.2.5", os: "Ubuntu 20.04" },
    source: { ip: "10.10.34.44", user: "CORP\\jmorales" },
    destination: { ip: "198.51.100.77", port: 8443, host: "cdn-sync-files.example" },
    decoder: "suricata",
    location: "/var/log/suricata/eve.json",
    fullLog: "Outbound TLS session transferred 1.8GB from workstation subnet to rare ASN on TCP/8443.",
    mitre: [
      {
        tactic: "Exfiltration",
        tacticId: "TA0010",
        technique: "Exfiltration Over Web Service",
        techniqueId: "T1567",
        confidence: 78
      }
    ],
    tags: ["network", "exfiltration", "rare-asn"],
    raw: { flow: { bytes_toserver: 1932735283, dest_port: 8443 } }
  },
  {
    id: "WAZUH-10038",
    tenantId: "apex",
    timestamp: iso(8.2),
    severity: "medium",
    status: "closed",
    riskScore: 51,
    rule: {
      id: "100102",
      level: 8,
      description: "New local administrator account created",
      groups: ["windows", "account_changed"]
    },
    agent: { id: "002", name: "fin-vdi-044", ip: "10.10.34.44", os: "Windows 11 Enterprise" },
    source: { user: "CORP\\desktop-admin" },
    decoder: "windows_eventchannel",
    location: "Security",
    fullLog: "Event 4720 and 4732: local account temp_support created and added to Administrators.",
    mitre: [
      {
        tactic: "Persistence",
        tacticId: "TA0003",
        technique: "Create Account: Local Account",
        techniqueId: "T1136.001",
        confidence: 83
      }
    ],
    tags: ["account", "admin", "local"],
    raw: { win: { event_id: 4720, target_user: "temp_support" } }
  },
  {
    id: "WAZUH-10039",
    tenantId: "nova",
    timestamp: iso(0.9),
    severity: "high",
    status: "triage",
    riskScore: 86,
    rule: {
      id: "80792",
      level: 13,
      description: "Database process attempted outbound connection to suspicious IP",
      groups: ["database", "network", "anomaly"]
    },
    agent: { id: "006", name: "ehr-db-01", ip: "10.20.4.12", os: "Ubuntu 22.04" },
    source: { ip: "10.20.4.12", user: "postgres" },
    destination: { ip: "45.83.66.19", port: 443, host: "unknown" },
    process: { name: "postgres", pid: 1832 },
    decoder: "auditd",
    location: "/var/log/audit/audit.log",
    fullLog: "postgres process opened outbound TLS connection to newly observed external IP.",
    mitre: [
      {
        tactic: "Command and Control",
        tacticId: "TA0011",
        technique: "Application Layer Protocol",
        techniqueId: "T1071",
        confidence: 72
      }
    ],
    tags: ["database", "egress", "suspicious-ip"],
    raw: { auditd: { syscall: "connect", exe: "/usr/lib/postgresql/14/bin/postgres" } }
  }
];

export const dashboardMetrics: DashboardMetric[] = [
  { id: "critical", label: "Critical alerts", value: 7, delta: 18, intent: "bad" },
  { id: "incidents", label: "Open incidents", value: 5, delta: 11, intent: "warn" },
  { id: "mttr", label: "Mean triage time", value: "14m", delta: -22, intent: "good" },
  { id: "agents", label: "Active agents", value: 1284, delta: 3, intent: "good" },
  { id: "coverage", label: "MITRE coverage", value: "82%", delta: 6, intent: "good" },
  { id: "soar", label: "SOAR automations", value: 43, delta: 9, intent: "neutral" }
];

export const severityChart: ChartPoint[] = [
  { name: "Critical", value: 7 },
  { name: "High", value: 22 },
  { name: "Medium", value: 61 },
  { name: "Low", value: 93 },
  { name: "Info", value: 140 }
];

export const alertTrend: ChartPoint[] = [
  { name: "00:00", critical: 1, high: 4, medium: 11, value: 16 },
  { name: "04:00", critical: 2, high: 6, medium: 14, value: 22 },
  { name: "08:00", critical: 1, high: 7, medium: 18, value: 26 },
  { name: "12:00", critical: 3, high: 10, medium: 21, value: 34 },
  { name: "16:00", critical: 7, high: 14, medium: 28, value: 49 },
  { name: "20:00", critical: 4, high: 11, medium: 24, value: 39 }
];

export const topHosts: ChartPoint[] = [
  { name: "dc-01", value: 42 },
  { name: "vpn-gw-01", value: 33 },
  { name: "fin-vdi-044", value: 27 },
  { name: "ehr-db-01", value: 21 },
  { name: "payroll-api-02", value: 18 }
];

export const failedLogins: ChartPoint[] = [
  { name: "Mon", value: 182 },
  { name: "Tue", value: 201 },
  { name: "Wed", value: 390 },
  { name: "Thu", value: 244 },
  { name: "Fri", value: 318 },
  { name: "Sat", value: 155 },
  { name: "Sun", value: 130 }
];

export const malwareDetections: ChartPoint[] = [
  { name: "PhishLoader", value: 11 },
  { name: "CoinMiner", value: 4 },
  { name: "WebShell", value: 3 },
  { name: "CredentialDump", value: 2 }
];

export const networkActivity: ChartPoint[] = [
  { name: "00:00", inbound: 220, outbound: 180, value: 400 },
  { name: "04:00", inbound: 180, outbound: 155, value: 335 },
  { name: "08:00", inbound: 410, outbound: 280, value: 690 },
  { name: "12:00", inbound: 520, outbound: 440, value: 960 },
  { name: "16:00", inbound: 610, outbound: 760, value: 1370 },
  { name: "20:00", inbound: 390, outbound: 360, value: 750 }
];

export const mitreTechniques: MitreTechnique[] = [
  {
    tactic: "Initial Access",
    tacticId: "TA0001",
    technique: "External Remote Services",
    techniqueId: "T1133",
    detections: 18,
    coverage: 86,
    lastSeen: iso(0.15),
    severity: "critical"
  },
  {
    tactic: "Execution",
    tacticId: "TA0002",
    technique: "PowerShell",
    techniqueId: "T1059.001",
    detections: 31,
    coverage: 91,
    lastSeen: iso(0.55),
    severity: "high"
  },
  {
    tactic: "Persistence",
    tacticId: "TA0003",
    technique: "Web Shell",
    techniqueId: "T1505.003",
    detections: 3,
    coverage: 74,
    lastSeen: iso(1.1),
    severity: "high"
  },
  {
    tactic: "Privilege Escalation",
    tacticId: "TA0004",
    technique: "Valid Accounts",
    techniqueId: "T1078",
    detections: 22,
    coverage: 68,
    lastSeen: iso(4.2),
    severity: "low"
  },
  {
    tactic: "Defense Evasion",
    tacticId: "TA0005",
    technique: "Obfuscated Files or Information",
    techniqueId: "T1027",
    detections: 14,
    coverage: 79,
    lastSeen: iso(0.55),
    severity: "medium"
  },
  {
    tactic: "Credential Access",
    tacticId: "TA0006",
    technique: "Brute Force",
    techniqueId: "T1110",
    detections: 37,
    coverage: 93,
    lastSeen: iso(0.15),
    severity: "critical"
  },
  {
    tactic: "Discovery",
    tacticId: "TA0007",
    technique: "Account Discovery",
    techniqueId: "T1087",
    detections: 19,
    coverage: 72,
    lastSeen: iso(2.8),
    severity: "medium"
  },
  {
    tactic: "Lateral Movement",
    tacticId: "TA0008",
    technique: "Remote Services",
    techniqueId: "T1021",
    detections: 10,
    coverage: 64,
    lastSeen: iso(0.2),
    severity: "high"
  },
  {
    tactic: "Collection",
    tacticId: "TA0009",
    technique: "Archive Collected Data",
    techniqueId: "T1560",
    detections: 7,
    coverage: 55,
    lastSeen: iso(5.9),
    severity: "medium"
  },
  {
    tactic: "Exfiltration",
    tacticId: "TA0010",
    technique: "Exfiltration Over Web Service",
    techniqueId: "T1567",
    detections: 6,
    coverage: 61,
    lastSeen: iso(5.7),
    severity: "high"
  },
  {
    tactic: "Command and Control",
    tacticId: "TA0011",
    technique: "Application Layer Protocol",
    techniqueId: "T1071",
    detections: 8,
    coverage: 69,
    lastSeen: iso(0.9),
    severity: "high"
  }
];

export const incidents: Incident[] = [
  {
    id: "INC-2026-0520-001",
    tenantId: "apex",
    title: "Credential stuffing with successful RDP access",
    status: "investigating",
    severity: "critical",
    riskScore: 96,
    owner: "Arjun Rao",
    createdAt: iso(0.2),
    updatedAt: iso(0.05),
    affectedAssets: ["dc-01", "fin-vdi-044"],
    relatedAlertIds: ["WAZUH-10031", "WAZUH-10032", "WAZUH-10037"],
    mitre: [
      {
        tactic: "Credential Access",
        tacticId: "TA0006",
        technique: "Brute Force",
        techniqueId: "T1110",
        confidence: 94
      },
      {
        tactic: "Execution",
        tacticId: "TA0002",
        technique: "PowerShell",
        techniqueId: "T1059.001",
        confidence: 97
      }
    ],
    summary:
      "External RDP authentication failures against a service account were followed by successful logon, suspicious PowerShell execution, and later unusual outbound transfer volume.",
    timeline: [
      {
        id: "tl-001",
        timestamp: iso(0.7),
        title: "RDP brute force observed",
        description: "4625 failures for svc_backup originated from 185.244.25.18.",
        severity: "high",
        actor: "185.244.25.18",
        asset: "dc-01",
        evidence: ["WAZUH-10031"]
      },
      {
        id: "tl-002",
        timestamp: iso(0.55),
        title: "Encoded PowerShell spawned by Office",
        description: "WINWORD.EXE launched powershell.exe with bypass flags on fin-vdi-044.",
        severity: "high",
        actor: "CORP\\jmorales",
        asset: "fin-vdi-044",
        evidence: ["WAZUH-10032"]
      },
      {
        id: "tl-003",
        timestamp: iso(0.2),
        title: "Potential exfiltration path",
        description: "Large outbound TLS transfer to rare ASN over TCP/8443.",
        severity: "critical",
        asset: "vpn-gw-01",
        evidence: ["WAZUH-10037"]
      }
    ],
    recommendedActions: [
      "Disable svc_backup until ownership and recent authentication history are verified.",
      "Collect memory and triage artifacts from fin-vdi-044.",
      "Block 185.244.25.18 and 198.51.100.77 at egress controls.",
      "Review RDP exposure and conditional access policy."
    ]
  },
  {
    id: "INC-2026-0520-002",
    tenantId: "apex",
    title: "Payroll application possible web shell",
    status: "triage",
    severity: "high",
    riskScore: 84,
    owner: "Maya Chen",
    createdAt: iso(1.1),
    updatedAt: iso(0.7),
    affectedAssets: ["payroll-api-02"],
    relatedAlertIds: ["WAZUH-10033", "WAZUH-10034"],
    mitre: [
      {
        tactic: "Persistence",
        tacticId: "TA0003",
        technique: "Web Shell",
        techniqueId: "T1505.003",
        confidence: 91
      }
    ],
    summary:
      "A SQL injection attempt preceded the appearance of a hidden PHP artifact containing web shell primitives in an upload directory.",
    timeline: [
      {
        id: "tl-004",
        timestamp: iso(1.8),
        title: "SQL injection blocked",
        description: "WAF returned 403 to an injection probe against payroll API.",
        severity: "medium",
        actor: "203.0.113.9",
        asset: "payroll-api-02",
        evidence: ["WAZUH-10034"]
      },
      {
        id: "tl-005",
        timestamp: iso(1.1),
        title: "Suspicious PHP file created",
        description: "FIM detected .cache.php with eval and base64_decode patterns.",
        severity: "high",
        actor: "www-data",
        asset: "payroll-api-02",
        evidence: ["WAZUH-10033"]
      }
    ],
    recommendedActions: [
      "Quarantine the suspicious PHP artifact and capture filesystem metadata.",
      "Review upload validation controls and web server access logs around the write time.",
      "Rotate application secrets present on payroll-api-02."
    ]
  }
];

export const huntQueries: HuntQuery[] = [
  {
    id: "hunt-001",
    name: "Failed logins in last 24 hours",
    description: "Windows and Linux authentication failures by source, account, and host.",
    query: 'rule.groups:("authentication_failed" OR "pam") AND timestamp:[now-24h TO now]',
    language: "lucene",
    tags: ["identity", "wazuh"]
  },
  {
    id: "hunt-002",
    name: "Suspicious PowerShell activity",
    description: "PowerShell with encoded command, download cradle, or execution policy bypass.",
    query:
      'process.name:powershell.exe AND process.command_line:(*EncodedCommand* OR *DownloadString* OR *Bypass*)',
    language: "lucene",
    tags: ["windows", "execution"]
  },
  {
    id: "hunt-003",
    name: "Rare outbound connections",
    description: "High-volume egress to destinations not observed in the last 30 days.",
    query: '{"query":{"bool":{"must":[{"range":{"flow.bytes_toserver":{"gte":500000000}}}]}}}',
    language: "dsl",
    tags: ["network", "exfiltration"]
  }
];

export const huntResults: HuntResult[] = [
  {
    id: "hr-001",
    timestamp: iso(0.15),
    host: "dc-01",
    user: "svc_backup",
    eventType: "authentication",
    severity: "critical",
    message: "Successful RDP logon after 46 failures from 185.244.25.18.",
    source: "wazuh-alerts",
    mitre: "T1110"
  },
  {
    id: "hr-002",
    timestamp: iso(0.55),
    host: "fin-vdi-044",
    user: "CORP\\jmorales",
    eventType: "process",
    severity: "high",
    message: "WINWORD.EXE spawned encoded PowerShell command with bypass flags.",
    source: "sysmon",
    mitre: "T1059.001"
  },
  {
    id: "hr-003",
    timestamp: iso(5.7),
    host: "vpn-gw-01",
    user: "CORP\\jmorales",
    eventType: "network",
    severity: "high",
    message: "1.8GB outbound TLS session to rare destination over TCP/8443.",
    source: "suricata",
    mitre: "T1567"
  }
];

export const playbooks: SoarPlaybook[] = [
  {
    id: "pb-001",
    name: "High-risk identity compromise",
    description: "Enrich source IP, disable account, open ticket, and notify incident channel.",
    trigger: "critical authentication alert or impossible travel",
    enabled: true,
    lastRun: iso(0.1),
    runs24h: 9,
    steps: [
      { id: "s1", label: "Enrich IP reputation", type: "enrichment", status: "success" },
      { id: "s2", label: "Disable account pending approval", type: "approval", status: "running" },
      { id: "s3", label: "Create incident ticket", type: "ticket", status: "success" },
      { id: "s4", label: "Notify SOC channel", type: "notification", status: "success" }
    ]
  },
  {
    id: "pb-002",
    name: "Endpoint malware containment",
    description: "Verify quarantine, isolate endpoint through EDR, collect triage package.",
    trigger: "high confidence malware detection",
    enabled: true,
    lastRun: iso(2.4),
    runs24h: 6,
    steps: [
      { id: "s1", label: "Validate AV action", type: "enrichment", status: "success" },
      { id: "s2", label: "Isolate host", type: "containment", status: "idle" },
      { id: "s3", label: "Collect forensic package", type: "ticket", status: "idle" }
    ]
  },
  {
    id: "pb-003",
    name: "Web shell response",
    description: "Snapshot host, block IOC, preserve artifact, and alert application owner.",
    trigger: "FIM web shell signal",
    enabled: false,
    runs24h: 0,
    steps: [
      { id: "s1", label: "Snapshot workload", type: "containment", status: "idle" },
      { id: "s2", label: "Block file hash", type: "containment", status: "idle" },
      { id: "s3", label: "Notify app owner", type: "notification", status: "idle" }
    ]
  }
];

export const threatIntel: ThreatIntelIndicator[] = [
  {
    value: "185.244.25.18",
    type: "ip",
    reputation: "malicious",
    confidence: 92,
    sources: ["AbuseIPDB", "MISP", "OTX"],
    firstSeen: iso(720),
    lastSeen: iso(0.15),
    tags: ["credential-stuffing", "rdp"]
  },
  {
    value: "198.51.100.77",
    type: "ip",
    reputation: "suspicious",
    confidence: 71,
    sources: ["Internal DNS", "GreyNoise"],
    firstSeen: iso(11),
    lastSeen: iso(5.7),
    tags: ["rare-asn", "exfiltration"]
  },
  {
    value: "0e7f1b928d5140f8a32b7bfe93d2cdd2",
    type: "hash",
    reputation: "suspicious",
    confidence: 78,
    sources: ["VirusTotal", "Hybrid Analysis"],
    firstSeen: iso(240),
    lastSeen: iso(0.55),
    tags: ["powershell", "loader"]
  }
];

export function buildDemoReport(tenantId: string): SocReport {
  const tenant = tenants.find((item) => item.id === tenantId) ?? tenants[0];
  const tenantIncidents = incidents.filter((incident) => incident.tenantId === tenant.id);
  const markdown = `# ${tenant.name} AI SOC Report

Generated: ${new Date().toISOString()}
Period: Last 24 hours

## Executive Summary
The SOC observed elevated identity attack pressure, suspicious PowerShell execution, and one web application persistence signal. No confirmed ransomware behavior was identified, but one active investigation requires endpoint containment and identity review.

## Key Findings
- Critical credential stuffing sequence against dc-01 with successful RDP access.
- Office-spawned encoded PowerShell on fin-vdi-044.
- Hidden PHP file matching web shell behavior on payroll-api-02.
- Large outbound TLS transfer to a rare destination over TCP/8443.

## Recommended Actions
- Disable or rotate the svc_backup account and review privileged access.
- Isolate fin-vdi-044 pending forensic acquisition.
- Preserve the suspected web shell and rebuild payroll-api-02 if compromise is confirmed.
- Add egress allow-listing for sensitive workstation segments.
`;

  return {
    id: `RPT-${Date.now()}`,
    tenantId: tenant.id,
    title: `${tenant.name} AI SOC Report`,
    generatedAt: new Date().toISOString(),
    period: "Last 24 hours",
    executiveSummary:
      "Identity attack pressure and suspicious endpoint activity increased in the last 24 hours. The top concern is a possible chained intrusion involving RDP, Office-spawned PowerShell, and anomalous outbound data transfer.",
    keyFindings: [
      "Critical credential stuffing sequence against dc-01.",
      "Encoded PowerShell execution from a Microsoft Word parent process.",
      "Potential PHP web shell dropped on payroll-api-02.",
      "Outbound transfer spike to rare ASN on TCP/8443."
    ],
    metrics: dashboardMetrics,
    incidents: tenantIncidents,
    markdown
  };
}
