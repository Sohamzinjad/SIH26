import React, { useState } from 'react';
import {
  AlertCircle,
  Sparkles,
  Terminal,
  Check,
  ArrowRight,
  Info,
  Archive,
  Layers,
} from 'lucide-react';
import { uploadConfig, uploadFleetBatch, FleetBatchResponse } from '../api/client';

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string>('cisco_compliant');
  const [batchResult, setBatchResult] = useState<FleetBatchResponse | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArr = Array.from(e.target.files);
      setSelectedFiles(filesArr);
      setFilename(filesArr.length === 1 ? filesArr[0].name : `${filesArr.length} files selected`);
      setActivePreset('');
      setBatchResult(null);

      // If single text file, display content in textarea preview
      if (filesArr.length === 1 && !filesArr[0].name.toLowerCase().endsWith('.zip')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setRawText((event.target?.result as string) || '');
        };
        reader.readAsText(filesArr[0]);
      } else if (filesArr[0].name.toLowerCase().endsWith('.zip')) {
        setRawText(`! Archive: ${filesArr[0].name}\n! Batch Zip upload mode active. Click 'RUN COMPLIANCE AUDIT' to extract and audit all configs in parallel.`);
      }
    }
  };

  const loadPreset = (key: keyof typeof SAMPLE_CONFIGS, name: string) => {
    setRawText(SAMPLE_CONFIGS[key]);
    setFilename(name);
    setSelectedFiles([]);
    setActivePreset(key);
    setBatchResult(null);
    setError(null);
  };

  const handleAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isZip = selectedFiles.length > 0 && selectedFiles[0].name.toLowerCase().endsWith('.zip');
    const isMultiFile = selectedFiles.length > 1;

    if (!rawText.trim() && selectedFiles.length === 0) {
      setError('Please paste a configuration file or upload one.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setBatchResult(null);

    try {
      if (isZip || isMultiFile) {
        const batchRes = await uploadFleetBatch(selectedFiles);
        setBatchResult(batchRes);
      } else {
        const res = await uploadConfig({
          file: selectedFiles.length === 1 ? selectedFiles[0] : undefined,
          rawText: rawText || undefined,
          filename: filename,
        });

        if (res.ai_mapping_pending) {
          onAIMappingCreated();
        } else {
          onAuditCompleted(res.audit_id);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Audit execution failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const lineCount = rawText ? rawText.split('\n').length : 0;

  const presetStyle = (active: boolean) =>
    `text-left p-3.5 rounded border transition-colors duration-140 ${
      active
        ? 'border-white bg-[#18181c] text-white'
        : 'border-white/10 bg-[#121215] hover:border-white/25 text-[#a1a1aa]'
    }`;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="kicker mb-2">Ingest &amp; audit</div>
        <h1 className="font-sans font-bold text-2xl sm:text-3xl tracking-tight text-white">Submit device running config</h1>
        <p className="mt-2 max-w-2xl text-xs sm:text-sm text-[#a1a1aa] leading-relaxed">
          Evaluate multi-vendor running configs against CIS, NIST SP 800-53, and DISA STIG benchmarks using deterministic rule engines.
        </p>
      </div>

      {/* Preset Starter Cards */}
      <div className="space-y-2.5">
        <div className="font-mono text-[10px] uppercase font-bold text-[#71717a] tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span>Benchmark templates</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-[12px]">
          <button
            type="button"
            onClick={() => loadPreset('cisco_compliant', 'cisco_hardened.cfg')}
            className={presetStyle(activePreset === 'cisco_compliant')}
          >
            <div className="flex items-center justify-between mb-1 font-bold">
              <span className="text-white">Cisco IOS (Hardened)</span>
              {activePreset === 'cisco_compliant' && <Check className="w-3.5 h-3.5 text-white" />}
            </div>
            <p className="text-[11px] text-[#a1a1aa] leading-normal">CIS / NIST compliant baseline.</p>
          </button>

          <button
            type="button"
            onClick={() => loadPreset('cisco_vulnerable', 'cisco_vulnerable.cfg')}
            className={presetStyle(activePreset === 'cisco_vulnerable')}
          >
            <div className="flex items-center justify-between mb-1 font-bold">
              <span className="text-white">Cisco IOS (Vulnerable)</span>
              {activePreset === 'cisco_vulnerable' && <Check className="w-3.5 h-3.5 text-white" />}
            </div>
            <p className="text-[11px] text-[#a1a1aa] leading-normal">Multi-stage attack paths &amp; single-fix.</p>
          </button>

          <button
            type="button"
            onClick={() => loadPreset('fortios_vulnerable', 'fortigate_vuln.cfg')}
            className={presetStyle(activePreset === 'fortios_vulnerable')}
          >
            <div className="flex items-center justify-between mb-1 font-bold">
              <span className="text-white">FortiGate Firewall</span>
              {activePreset === 'fortios_vulnerable' && <Check className="w-3.5 h-3.5 text-white" />}
            </div>
            <p className="text-[11px] text-[#a1a1aa] leading-normal">FortiOS block syntax parsing.</p>
          </button>

          <button
            type="button"
            onClick={() => loadPreset('whitebox_unknown', 'openflow_whitebox.cfg')}
            className={presetStyle(activePreset === 'whitebox_unknown')}
          >
            <div className="flex items-center justify-between mb-1 font-bold">
              <span className="text-white">Whitebox / Unknown</span>
              {activePreset === 'whitebox_unknown' && <Check className="w-3.5 h-3.5 text-white" />}
            </div>
            <p className="text-[11px] text-[#a1a1aa] leading-normal">Triggers AI proposal &amp; human approval.</p>
          </button>
        </div>
      </div>

      {error && (
        <div className="banner banner-error flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Ingestion Form */}
      <form onSubmit={handleAuditSubmit} className="card p-6 space-y-5 border border-white/15 bg-[#121215]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-mono text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
              Device hostname / target file
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="e.g. core-router-01.cfg"
              className="field font-medium !bg-black border-white/15 focus:border-white"
              required
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
              Upload config file or zip archive (.zip, .cfg, .txt)
            </label>
            <label className="flex items-center justify-between px-3 py-2 rounded bg-black border border-white/15 hover:border-white/40 cursor-pointer transition-colors">
              <span className="text-[12px] text-[#a1a1aa] truncate max-w-[220px]">
                {selectedFiles.length > 0 ? (selectedFiles.length === 1 ? selectedFiles[0].name : `${selectedFiles.length} files selected`) : 'Choose file or .zip archive...'}
              </span>
              <span className="btn btn-ghost btn-sm !py-1 !px-2.5 flex items-center gap-1">
                <Archive className="w-3 h-3" />
                Browse
              </span>
              <input
                type="file"
                multiple
                accept=".zip,.tar.gz,.cfg,.txt,.conf,.log"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Batch Upload Summary Display */}
        {batchResult && (
          <div className="p-4 rounded border border-white/15 bg-black space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2 font-sans text-xs font-bold text-white uppercase tracking-wider">
                <Layers className="w-4 h-4 text-white" />
                Fleet batch audit complete
              </div>
              <span className="badge badge-accent">{batchResult.completed_count} / {batchResult.total_files} configs audited</span>
            </div>

            <div className="grid grid-cols-1 divide-y divide-white/10 max-h-56 overflow-y-auto text-xs">
              {batchResult.results.map((r) => (
                <div key={r.audit_id || r.filename} className="py-2 flex items-center justify-between gap-3 hover:bg-[#18181c] px-2 rounded transition-colors">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className="font-medium text-white truncate">{r.filename}</span>
                    <span className="badge badge-neutral uppercase">{r.vendor}</span>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="text-right">
                      <span className="font-mono font-bold text-white">
                        {r.compliance_score.toFixed(1)}% score
                      </span>
                      <span className="font-mono text-[9.5px] text-[#71717a] block">{r.failed_findings} fails &bull; {r.attack_paths_count} threats</span>
                    </div>

                    {r.audit_id && (
                      <button
                        type="button"
                        onClick={() => onAuditCompleted(r.audit_id)}
                        className="btn btn-primary btn-sm"
                      >
                        View audit &rarr;
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Textarea */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-mono text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-white" />
              <span>Running configuration payload</span>
            </label>
            <span className="font-mono text-[10px] text-[#71717a]">
              {lineCount} lines &bull; {rawText.length} bytes
            </span>
          </div>

          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={13}
            placeholder="Paste device running-config here..."
            className="code-surface w-full p-3 text-[#e5e5e5] resize-y outline-none border border-white/15 bg-black focus:border-white text-xs"
            spellCheck={false}
          />
        </div>

        {/* Footer CTAs */}
        <div className="flex flex-wrap justify-between items-center gap-4 pt-1">
          <div className="flex items-center text-xs text-[#a1a1aa]">
            <Info className="w-3.5 h-3.5 mr-1.5 text-white" />
            <span>Deterministic state machine audit: sub-millisecond execution</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? (
              <span>Executing audit…</span>
            ) : (
              <>
                <span>Run compliance audit</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};