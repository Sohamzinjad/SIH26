import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileCode, 
  AlertCircle, 
  Sparkles, 
  Terminal, 
  Check, 
  ArrowRight,
  Shield,
  Info
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
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="border-b border-[#B9B9B4] pb-5">
        <div className="text-[11px] font-mono tracking-widest text-[#5E5E5E] uppercase font-bold">
          INGEST & AUDIT
        </div>
        <h1 className="text-2xl font-black text-[#171717] tracking-tight uppercase font-display mt-0.5">
          Submit Device Running Config
        </h1>
        <p className="text-xs text-[#5E5E5E] font-sans mt-1">
          Evaluate multi-vendor running configs against CIS, NIST SP 800-53, and DISA STIG benchmarks using deterministic rule engines.
        </p>
      </div>

      {/* Preset Starter Cards */}
      <div className="space-y-2.5">
        <div className="text-[11px] font-mono uppercase font-bold text-[#5E5E5E] tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#00A86B]" />
          <span>BENCHMARK TEMPLATES</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
          <button
            type="button"
            onClick={() => loadPreset('cisco_compliant', 'cisco_hardened.cfg')}
            className={`text-left p-3.5 border transition trinetra-chamfer ${
              activePreset === 'cisco_compliant'
                ? 'bg-[#171717] text-white border-[#171717]'
                : 'bg-[#F1F1EF] text-[#171717] border-[#B9B9B4] hover:bg-[#EAEAE7]'
            }`}
          >
            <div className="flex items-center justify-between mb-1 font-bold">
              <span className={activePreset === 'cisco_compliant' ? 'text-[#00A86B]' : 'text-[#171717]'}>
                Cisco IOS (Hardened)
              </span>
              {activePreset === 'cisco_compliant' && <Check className="w-3.5 h-3.5 text-[#00A86B]" />}
            </div>
            <p className="text-[11px] text-[#5E5E5E] font-sans leading-relaxed">
              CIS / NIST Compliant baseline.
            </p>
          </button>

          <button
            type="button"
            onClick={() => loadPreset('cisco_vulnerable', 'cisco_vulnerable.cfg')}
            className={`text-left p-3.5 border transition trinetra-chamfer ${
              activePreset === 'cisco_vulnerable'
                ? 'bg-[#171717] text-white border-[#171717]'
                : 'bg-[#F1F1EF] text-[#171717] border-[#B9B9B4] hover:bg-[#EAEAE7]'
            }`}
          >
            <div className="flex items-center justify-between mb-1 font-bold">
              <span className={activePreset === 'cisco_vulnerable' ? 'text-[#D64545]' : 'text-[#171717]'}>
                Cisco IOS (Vulnerable)
              </span>
              {activePreset === 'cisco_vulnerable' && <Check className="w-3.5 h-3.5 text-[#D64545]" />}
            </div>
            <p className="text-[11px] text-[#5E5E5E] font-sans leading-relaxed">
              Multi-stage attack paths & single-fix.
            </p>
          </button>

          <button
            type="button"
            onClick={() => loadPreset('fortios_vulnerable', 'fortigate_vuln.cfg')}
            className={`text-left p-3.5 border transition trinetra-chamfer ${
              activePreset === 'fortios_vulnerable'
                ? 'bg-[#171717] text-white border-[#171717]'
                : 'bg-[#F1F1EF] text-[#171717] border-[#B9B9B4] hover:bg-[#EAEAE7]'
            }`}
          >
            <div className="flex items-center justify-between mb-1 font-bold">
              <span className={activePreset === 'fortios_vulnerable' ? 'text-[#D4A017]' : 'text-[#171717]'}>
                FortiGate Firewall
              </span>
              {activePreset === 'fortios_vulnerable' && <Check className="w-3.5 h-3.5 text-[#D4A017]" />}
            </div>
            <p className="text-[11px] text-[#5E5E5E] font-sans leading-relaxed">
              FortiOS block syntax parsing.
            </p>
          </button>

          <button
            type="button"
            onClick={() => loadPreset('whitebox_unknown', 'openflow_whitebox.cfg')}
            className={`text-left p-3.5 border transition trinetra-chamfer ${
              activePreset === 'whitebox_unknown'
                ? 'bg-[#171717] text-white border-[#171717]'
                : 'bg-[#F1F1EF] text-[#171717] border-[#B9B9B4] hover:bg-[#EAEAE7]'
            }`}
          >
            <div className="flex items-center justify-between mb-1 font-bold">
              <span className={activePreset === 'whitebox_unknown' ? 'text-[#0057B8]' : 'text-[#171717]'}>
                Whitebox / Unknown
              </span>
              {activePreset === 'whitebox_unknown' && <Check className="w-3.5 h-3.5 text-[#0057B8]" />}
            </div>
            <p className="text-[11px] text-[#5E5E5E] font-sans leading-relaxed">
              Triggers AI proposal & human approval.
            </p>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[#D64545] text-white font-mono text-xs flex items-center space-x-3 trinetra-chamfer">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Ingestion Form */}
      <form onSubmit={handleAuditSubmit} className="bg-[#F1F1EF] border border-[#B9B9B4] trinetra-chamfer p-6 space-y-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
          <div>
            <label className="block text-[11px] font-bold text-[#171717] uppercase tracking-wider mb-2">
              Device Hostname / Target File:
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="e.g. core-router-01.cfg"
              className="w-full bg-[#EAEAE7] border border-[#B9B9B4] text-xs text-[#171717] font-bold px-3.5 py-2 focus:outline-none focus:border-[#171717]"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#171717] uppercase tracking-wider mb-2">
              Upload Config (.cfg, .txt, .conf):
            </label>
            <label className="flex items-center justify-between px-3.5 py-2 bg-[#EAEAE7] border border-[#B9B9B4] hover:border-[#171717] cursor-pointer transition">
              <span className="text-xs text-[#5E5E5E] truncate max-w-[200px]">
                {selectedFile ? selectedFile.name : 'Choose file...'}
              </span>
              <span className="text-[11px] font-bold bg-[#171717] text-white px-2.5 py-0.5">
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

        {/* Textarea */}
        <div className="space-y-2 font-mono">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-[#171717] uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-[#00A86B]" />
              <span>RUNNING CONFIGURATION PAYLOAD</span>
            </label>
            <span className="text-[11px] text-[#5E5E5E]">
              {lineCount} lines &bull; {rawText.length} bytes
            </span>
          </div>

          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={14}
            placeholder="Paste device running-config here..."
            className="w-full bg-[#171717] text-[#00A86B] font-mono text-xs border border-[#232323] p-4 focus:outline-none leading-relaxed resize-y"
            spellCheck={false}
          />
        </div>

        {/* Footer CTAs */}
        <div className="flex justify-between items-center pt-2 font-mono">
          <div className="flex items-center text-[11px] text-[#5E5E5E]">
            <Info className="w-3.5 h-3.5 mr-1 text-[#00A86B]" />
            <span>Deterministic state machine audit: sub-millisecond execution</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center space-x-2 bg-[#171717] hover:bg-[#232323] text-white font-bold px-6 py-2.5 trinetra-chamfer text-xs transition shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>EXECUTING AUDIT...</span>
            ) : (
              <>
                <span>RUN COMPLIANCE AUDIT</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
