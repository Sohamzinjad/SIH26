import React, { useState } from 'react';
import { UploadCloud, FileCode, CheckCircle2, AlertCircle, Sparkles, ShieldAlert } from 'lucide-react';
import { uploadConfig } from '../api/client';

interface UploadViewProps {
  onAuditCompleted: (auditId: number) => void;
  onAIMappingCreated: () => void;
}

const SAMPLE_CONFIGS = {
  cisco_compliant: `!
version 15.6
hostname Core-Router-01
aaa new-model
aaa authentication login default local
service password-encryption
enable secret 9 $9$m0Q8Fm671$hX
username sysadmin privilege 15 secret 9 $9$a89KlOp0$zY
login block-for 180 attempts 3 within 60
no ip http server
ip http secure-server
ip ssh version 2
crypto key generate rsa modulus 4096
no ip source-route
no service finger
no service tcp-small-servers
no cdp run
service timestamps log datetime msec
logging buffered 64000
logging host 10.10.50.100
logging trap informational
snmp-server group SECGROUP v3 priv
snmp-server user secadmin SECGROUP v3 auth sha StrongAuth987! priv aes 128 StrongPriv654!
ip access-list standard MGMT-HOSTS
 permit 10.10.50.0 0.0.0.255
 deny any
interface GigabitEthernet0/0
 description WAN-Uplink
 ip address 203.0.113.1 255.255.255.252
 no cdp enable
line con 0
 exec-timeout 10 0
line vty 0 15
 access-class MGMT-HOSTS in
 exec-timeout 5 0
 transport input ssh
end`,

  cisco_vulnerable: `!
version 15.2
hostname Branch-Gateway-99
no aaa new-model
enable password cisco123
username admin privilege 15 password 0 admin123
username guest privilege 1 password 0 guest
ip http server
snmp-server community public ro
snmp-server community private rw
interface GigabitEthernet0/0
 description WAN-Internet
 ip address 198.51.100.2 255.255.255.0
line con 0
 exec-timeout 0 0
 password consolepass
line vty 0 4
 exec-timeout 0 0
 transport input telnet ssh
 login
line vty 5 15
 transport input all
 login
end`,

  fortios_vulnerable: `# FortiGate Vulnerable Config
config system global
    set hostname "VULN-FW-02"
    set admintimeout 0
    set admin-telnet enable
end
config system interface
    edit "port1"
        set vdom "root"
        set ip 192.168.1.1 255.255.255.0
        set allowaccess ping http telnet
    next
end
config system snmp community
    edit 1
        set name "public"
        set status enable
    next
end`,

  whitebox_unknown: `;; Whitebox OpenFlow / NOS Custom Appliance Config
[system.core]
device_identifier = "Whitebox-Edge-01"
operating_system = "OpenNOS-Micro"
session_idle_limit = 0

[network.port.eth0]
address = "172.16.10.1/24"
mode = "routed"
management_protocols = ["telnet", "http"]

[network.port.eth1]
address = "10.200.0.1/16"
mode = "lan"

[telemetry.snmp]
active = true
query_identifier = "public"
access_level = "read_only"

[security.credentials]
master_auth = "disabled"
local_operator = "admin:unencrypted:pass123"`
};

export const UploadView: React.FC<UploadViewProps> = ({
  onAuditCompleted,
  onAIMappingCreated,
}) => {
  const [rawText, setRawText] = useState('');
  const [filename, setFilename] = useState('running-config.cfg');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFilename(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setRawText(event.target?.result as string || '');
      };
      reader.readAsText(file);
    }
  };

  const loadPreset = (key: keyof typeof SAMPLE_CONFIGS, name: string) => {
    setRawText(SAMPLE_CONFIGS[key]);
    setFilename(name);
    setSelectedFile(null);
    setError(null);
  };

  const handleAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim() && !selectedFile) {
      setError('Please paste a configuration file or upload one.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await uploadConfig({
        file: selectedFile || undefined,
        rawText: rawText || undefined,
        filename: filename,
      });

      if (res.ai_mapping_pending) {
        onAIMappingCreated();
      } else {
        onAuditCompleted(res.audit_id);
      }
    } catch (err: any) {
      setError(err.message || 'Audit execution failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">Network Device Configuration Audit</h2>
        <p className="text-sm text-slate-400">
          Upload any running-config (.cfg, .txt) from Cisco, Fortinet, or an uncatalogued white-box vendor.
        </p>
      </div>

      {/* Preset Demo Buttons */}
      <div className="bg-dark-800 border border-dark-600 rounded-xl p-4">
        <div className="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-3 flex items-center space-x-1">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Quick Demo Presets:</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => loadPreset('cisco_compliant', 'cisco_hardened.cfg')}
            className="text-xs text-left bg-dark-700 hover:bg-dark-600 p-2.5 rounded-lg border border-dark-500/50 transition text-emerald-400"
          >
            <div className="font-semibold">Cisco IOS (Hardened)</div>
            <div className="text-[10px] text-slate-400">CIS/NIST Compliant (~90%)</div>
          </button>

          <button
            type="button"
            onClick={() => loadPreset('cisco_vulnerable', 'cisco_vulnerable.cfg')}
            className="text-xs text-left bg-dark-700 hover:bg-dark-600 p-2.5 rounded-lg border border-dark-500/50 transition text-rose-400"
          >
            <div className="font-semibold">Cisco IOS (Vulnerable)</div>
            <div className="text-[10px] text-slate-400">Attack chains + single fix</div>
          </button>

          <button
            type="button"
            onClick={() => loadPreset('fortios_vulnerable', 'fortigate_vuln.cfg')}
            className="text-xs text-left bg-dark-700 hover:bg-dark-600 p-2.5 rounded-lg border border-dark-500/50 transition text-amber-400"
          >
            <div className="font-semibold">FortiGate Firewall</div>
            <div className="text-[10px] text-slate-400">Non-compliant FortiOS</div>
          </button>

          <button
            type="button"
            onClick={() => loadPreset('whitebox_unknown', 'openflow_whitebox.cfg')}
            className="text-xs text-left bg-blue-900/20 hover:bg-blue-900/40 p-2.5 rounded-lg border border-blue-500/40 transition text-blue-300"
          >
            <div className="font-semibold">Whitebox / Unknown</div>
            <div className="text-[10px] text-slate-400">AI proposal & approval</div>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center space-x-3 text-rose-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Form */}
      <form onSubmit={handleAuditSubmit} className="bg-dark-800 border border-dark-600 rounded-xl p-6 space-y-6">
        <div>
          <label className="block text-xs uppercase font-semibold text-slate-400 tracking-wider mb-2">
            Target Config File:
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="router-config.cfg"
              className="bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white w-full focus:outline-none focus:border-blue-500"
            />
            <label className="cursor-pointer bg-dark-700 hover:bg-dark-600 text-slate-200 text-xs px-4 py-2.5 rounded-lg border border-dark-500 transition whitespace-nowrap">
              Browse File...
              <input type="file" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
              Configuration Text ({rawText.split('\n').filter(Boolean).length} lines):
            </label>
            {rawText && (
              <button
                type="button"
                onClick={() => setRawText('')}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>
          <textarea
            rows={14}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste running configuration here or choose a quick demo preset above..."
            className="w-full bg-dark-900 border border-dark-600 rounded-lg p-4 font-mono text-xs text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2 transition"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Processing Vendor Detection & Compliance Audit...</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-5 h-5" />
              <span>Initiate Security & Compliance Audit</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
