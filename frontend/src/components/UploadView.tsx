import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileCode, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ShieldAlert, 
  Terminal, 
  Cpu, 
  Layers, 
  Sliders, 
  Check, 
  ArrowRight,
  FileText
} from 'lucide-react';
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
  const [rawText, setRawText] = useState(SAMPLE_CONFIGS.cisco_compliant);
  const [filename, setFilename] = useState('cisco_hardened.cfg');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string>('cisco_compliant');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFilename(file.name);
      setActivePreset('');
      const reader = new FileReader();
      reader.onload = (event) => {
        setRawText((event.target?.result as string) || '');
      };
      reader.readAsText(file);
    }
  };

  const loadPreset = (key: keyof typeof SAMPLE_CONFIGS, name: string) => {
    setRawText(SAMPLE_CONFIGS[key]);
    setFilename(name);
    setSelectedFile(null);
    setActivePreset(key);
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

  const lineCount = rawText ? rawText.split('\n').length : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Pinecone Header */}
      <div className="border-b border-[#22262F] pb-5">
        <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1 font-mono">
          <span>Indexes</span>
          <span>/</span>
          <span className="text-slate-200">Ingest Configuration</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Create Compliance Audit Run</h1>
        <p className="text-xs text-[#9AA2B0] mt-1">
          Submit network device running configurations to evaluate deterministic CIS, NIST SP 800-53, and DISA STIG controls.
        </p>
      </div>

      {/* Preset Starter Cards (Pinecone Templates) */}
      <div className="space-y-2">
        <div className="text-[11px] uppercase font-semibold text-[#9AA2B0] tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Quick Benchmark Templates</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => loadPreset('cisco_compliant', 'cisco_hardened.cfg')}
            className={`text-left p-3.5 rounded-xl border transition-all ${
              activePreset === 'cisco_compliant'
                ? 'bg-[#191D2B] border-emerald-500/50 shadow-sm'
                : 'bg-[#12141A] border-[#22262F] hover:border-[#353A4E]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-emerald-400">Cisco IOS (Hardened)</span>
              {activePreset === 'cisco_compliant' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </div>
            <p className="text-[11px] text-[#9AA2B0] leading-relaxed">
              CIS / NIST Compliant baseline (~90% score).
            </p>
          </button>

          <button
            type="button"
            onClick={() => loadPreset('cisco_vulnerable', 'cisco_vulnerable.cfg')}
            className={`text-left p-3.5 rounded-xl border transition-all ${
              activePreset === 'cisco_vulnerable'
                ? 'bg-[#191D2B] border-rose-500/50 shadow-sm'
                : 'bg-[#12141A] border-[#22262F] hover:border-[#353A4E]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-rose-400">Cisco IOS (Vulnerable)</span>
              {activePreset === 'cisco_vulnerable' && <Check className="w-3.5 h-3.5 text-rose-400" />}
            </div>
            <p className="text-[11px] text-[#9AA2B0] leading-relaxed">
              Multiple attack chains + single-fix severance.
            </p>
          </button>

          <button
            type="button"
            onClick={() => loadPreset('fortios_vulnerable', 'fortigate_vuln.cfg')}
            className={`text-left p-3.5 rounded-xl border transition-all ${
              activePreset === 'fortios_vulnerable'
                ? 'bg-[#191D2B] border-amber-500/50 shadow-sm'
                : 'bg-[#12141A] border-[#22262F] hover:border-[#353A4E]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-amber-400">FortiGate Firewall</span>
              {activePreset === 'fortios_vulnerable' && <Check className="w-3.5 h-3.5 text-amber-400" />}
            </div>
            <p className="text-[11px] text-[#9AA2B0] leading-relaxed">
              FortiOS syntax with insecure management exposed.
            </p>
          </button>

          <button
            type="button"
            onClick={() => loadPreset('whitebox_unknown', 'openflow_whitebox.cfg')}
            className={`text-left p-3.5 rounded-xl border transition-all ${
              activePreset === 'whitebox_unknown'
                ? 'bg-[#191D2B] border-cyan-500/50 shadow-sm'
                : 'bg-[#12141A] border-[#22262F] hover:border-[#353A4E]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-cyan-400">Whitebox / Unknown</span>
              {activePreset === 'whitebox_unknown' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
            </div>
            <p className="text-[11px] text-[#9AA2B0] leading-relaxed">
              Triggers AI schema proposal & human approval.
            </p>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-3 text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Configuration Ingestion Form */}
      <form onSubmit={handleAuditSubmit} className="bg-[#12141A] border border-[#22262F] rounded-xl p-6 space-y-6 shadow-pinecone">
        {/* Filename & Drag Drop Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] uppercase font-semibold text-[#9AA2B0] tracking-wider mb-2">
              Target Identifier / Hostname File:
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="e.g. core-router-01.cfg"
              className="w-full bg-[#0A0C0F] border border-[#22262F] focus:border-emerald-500 rounded-lg px-3.5 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase font-semibold text-[#9AA2B0] tracking-wider mb-2">
              Upload Config File (.cfg, .txt, .conf):
            </label>
            <label className="flex items-center justify-between px-3.5 py-2 bg-[#0A0C0F] border border-[#22262F] hover:border-slate-500 rounded-lg cursor-pointer transition">
              <span className="text-xs text-slate-400 truncate max-w-[200px]">
                {selectedFile ? selectedFile.name : 'Choose file or drag & drop...'}
              </span>
              <span className="text-[11px] font-medium bg-[#1A1D24] text-slate-200 px-2.5 py-0.5 rounded border border-[#2C313B]">
                Browse
              </span>
              <input
                type="file"
                accept=".cfg,.txt,.conf,.log"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Configuration Editor / Raw Text */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] uppercase font-semibold text-[#9AA2B0] tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Running Configuration Payload</span>
            </label>
            <span className="text-[11px] font-mono text-slate-400">
              {lineCount} lines &bull; {rawText.length} bytes
            </span>
          </div>

          <div className="relative">
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={14}
              placeholder="Paste device running-config here..."
              className="w-full bg-[#0A0C0F] border border-[#22262F] focus:border-emerald-500 rounded-lg p-4 font-mono text-xs text-emerald-400 placeholder-slate-600 focus:outline-none transition leading-relaxed resize-y"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Engine Specs Pill Banner */}
        <div className="p-3 bg-[#0A0C0F] border border-[#22262F] rounded-lg flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Active Frameworks: <strong className="text-slate-200">CIS Level 1/2 &bull; NIST SP 800-53 Rev 5 &bull; DISA STIG</strong></span>
          </div>
          <div className="flex items-center space-x-2 font-mono text-slate-500">
            <span>Air-Gapped Local Inference Engine</span>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center space-x-2 bg-white hover:bg-neutral-200 text-neutral-900 font-semibold px-5 py-2.5 rounded-lg text-xs transition shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                <span>Executing Deterministic Audit...</span>
              </>
            ) : (
              <>
                <span>Run Compliance Audit</span>
                <ArrowRight className="w-4 h-4 text-black stroke-[2.5]" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
