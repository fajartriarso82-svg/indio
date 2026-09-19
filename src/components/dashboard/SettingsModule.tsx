'use client'

import { useState, useEffect } from 'react'
import {
  Save,
  Building,
  Users,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit,
  Lock,
  Link2,
  ExternalLink,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Images,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import GalleryModule from './GalleryModule'

export default function SettingsModule() {
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)

  // Profile States
  const [companyId, setCompanyId] = useState('')
  const [name, setName] = useState('')
  const [npwpNumber, setNpwpNumber] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [picName, setPicName] = useState('')
  const [picPhone, setPicPhone] = useState('')

  // Procurement Channel Links & Icons
  const [siplahUrl, setSiplahUrl] = useState('')
  const [ekatalogUrl, setEkatalogUrl] = useState('')
  const [padiUmkmUrl, setPadiUmkmUrl] = useState('')
  const [siplahIcon, setSiplahIcon] = useState('')
  const [ekatalogIcon, setEkatalogIcon] = useState('')
  const [padiUmkmIcon, setPadiUmkmIcon] = useState('')
  const [uploadingChannel, setUploadingChannel] = useState<string | null>(null)
  const [channelsLoading, setChannelsLoading] = useState(false)
  const [channelsSuccess, setChannelsSuccess] = useState('')
  const [channelsError, setChannelsError] = useState('')

  // Password Change States
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPass, setShowCurrentPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [changePassLoading, setChangePassLoading] = useState(false)
  const [passSuccessMsg, setPassSuccessMsg] = useState('')
  const [passErrorMsg, setPassErrorMsg] = useState('')

  // Files
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [kopFile, setKopFile] = useState<File | null>(null)
  const [nibFile, setNibFile] = useState<File | null>(null)
  const [npwpFile, setNpwpFile] = useState<File | null>(null)
  const [aktaFile, setAktaFile] = useState<File | null>(null)

  // Uploaded URLs
  const [logoUrl, setLogoUrl] = useState('')
  const [kopUrl, setKopUrl] = useState('')
  const [nibUrl, setNibUrl] = useState('')
  const [npwpUrl, setNpwpUrl] = useState('')
  const [aktaUrl, setAktaUrl] = useState('')

  // Employees
  const [employees, setEmployees] = useState<any[]>([])
  const [empModalOpen, setEmpModalOpen] = useState(false)
  const [empForm, setEmpForm] = useState({ id: '', employeeId: '', name: '', position: '', phone: '', isActive: true })

  useEffect(() => {
    fetchCompany()
    fetchEmployees()
  }, [])

  const fetchCompany = async () => {
    try {
      const res = await fetch('/api/company')
      const data = await res.json()
      if (data.success && data.data) {
        const c = data.data
        setCompanyId(c.id)
        setName(c.name || '')
        setNpwpNumber(c.npwpNumber || '')
        setAddress(c.address || '')
        setPhone(c.phone || '')
        setEmail(c.email || '')
        setPicName(c.picName || '')
        setPicPhone(c.picPhone || '')
        setLogoUrl(c.logoFile || '')
        setKopUrl(c.kopFile || '')
        setNibUrl(c.nibFile || '')
        setNpwpUrl(c.npwpFile || '')
        setAktaUrl(c.aktaFile || '')
        setSiplahUrl(c.siplahUrl || '')
        setEkatalogUrl(c.ekatalogUrl || '')
        setPadiUmkmUrl(c.padiUmkmUrl || '')
        setSiplahIcon(c.siplahIcon || '')
        setEkatalogIcon(c.ekatalogIcon || '')
        setPadiUmkmIcon(c.padiUmkmIcon || '')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setFetchLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees')
      const data = await res.json()
      if (data.success) {
        setEmployees(data.data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const uploadFile = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const uploadRes = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    const uploadData = await uploadRes.json()
    if (!uploadData.success) throw new Error('Gagal upload')
    return uploadData.url
  }

  const handleSaveProfile = async () => {
    setLoading(true)
    try {
      let currentLogo = logoUrl
      let currentKop = kopUrl
      let currentNib = nibUrl
      let currentNpwp = npwpUrl
      let currentAkta = aktaUrl

      if (logoFile) currentLogo = await uploadFile(logoFile)
      if (kopFile) currentKop = await uploadFile(kopFile)
      if (nibFile) currentNib = await uploadFile(nibFile)
      if (npwpFile) currentNpwp = await uploadFile(npwpFile)
      if (aktaFile) currentAkta = await uploadFile(aktaFile)

      const payload = {
        name, npwpNumber, address, phone, email, picName, picPhone,
        logoFile: currentLogo, kopFile: currentKop, nibFile: currentNib, npwpFile: currentNpwp, aktaFile: currentAkta,
        siplahUrl, ekatalogUrl, padiUmkmUrl,
        siplahIcon, ekatalogIcon, padiUmkmIcon
      }

      const res = await fetch('/api/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (data.success) {
        alert('Profil perusahaan berhasil disimpan.')
        fetchCompany()
      } else {
        alert('Gagal menyimpan profil.')
      }
    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan saat menyimpan.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveChannels = async (e: React.FormEvent) => {
    e.preventDefault()
    setChannelsLoading(true)
    setChannelsSuccess('')
    setChannelsError('')
    try {
      const res = await fetch('/api/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siplahUrl: siplahUrl.trim(),
          ekatalogUrl: ekatalogUrl.trim(),
          padiUmkmUrl: padiUmkmUrl.trim(),
          siplahIcon: siplahIcon.trim(),
          ekatalogIcon: ekatalogIcon.trim(),
          padiUmkmIcon: padiUmkmIcon.trim(),
        }),
      })
      const data = await res.json()
      if (data.success) {
        setChannelsSuccess('Link dan icon kanal pengadaan berizin berhasil disimpan dan disinkronkan ke Landing Page.')
        setTimeout(() => setChannelsSuccess(''), 5000)
      } else {
        setChannelsError(data.error || 'Gagal menyimpan kanal pengadaan.')
      }
    } catch (err) {
      console.error(err)
      setChannelsError('Terjadi kesalahan saat menyimpan kanal pengadaan.')
    } finally {
      setChannelsLoading(false)
    }
  }

  const handleUploadChannelIcon = async (channel: 'siplah' | 'ekatalog' | 'padi', file: File) => {
    setUploadingChannel(channel)
    try {
      const url = await uploadFile(file)
      if (channel === 'siplah') setSiplahIcon(url)
      if (channel === 'ekatalog') setEkatalogIcon(url)
      if (channel === 'padi') setPadiUmkmIcon(url)
    } catch (err) {
      console.error(err)
      alert('Gagal mengunggah icon kanal')
    } finally {
      setUploadingChannel(null)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPassSuccessMsg('')
    setPassErrorMsg('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPassErrorMsg('Semua kolom password wajib diisi.')
      return
    }

    if (newPassword.length < 6) {
      setPassErrorMsg('Password baru minimal harus 6 karakter.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPassErrorMsg('Konfirmasi password baru tidak cocok.')
      return
    }

    setChangePassLoading(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setPassSuccessMsg('Password berhasil diperbarui!')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => setPassSuccessMsg(''), 5000)
      } else {
        setPassErrorMsg(data.error || 'Gagal mengubah password.')
      }
    } catch (err) {
      console.error(err)
      setPassErrorMsg('Terjadi kesalahan koneksi saat mengubah password.')
    } finally {
      setChangePassLoading(false)
    }
  }

  const handleSaveEmployee = async () => {
    setLoading(true)
    try {
      const url = empForm.id ? `/api/employees/${empForm.id}` : '/api/employees'
      const method = empForm.id ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empForm)
      })
      const data = await res.json()
      if (data.success) {
        alert('Data karyawan berhasil disimpan')
        fetchEmployees()
        setEmpModalOpen(false)
      } else {
        alert(data.error)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('Hapus karyawan ini?')) return
    try {
      await fetch(`/api/employees/${id}`, { method: 'DELETE' })
      fetchEmployees()
    } catch (e) {
      console.error(e)
    }
  }

  const openEmpModal = (emp?: any) => {
    if (emp) {
      setEmpForm({ id: emp.id, employeeId: emp.employeeId, name: emp.name, position: emp.position || '', phone: emp.phone || '', isActive: emp.isActive })
    } else {
      setEmpForm({ id: '', employeeId: '', name: '', position: '', phone: '', isActive: true })
    }
    setEmpModalOpen(true)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Pengaturan Sistem & Perusahaan</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola profil perusahaan, link kanal pengadaan, karyawan, dan keamanan akun dashboard.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full sm:w-[750px] grid-cols-5">
          <TabsTrigger value="profile">Profil & Dokumen</TabsTrigger>
          <TabsTrigger value="channels">Kanal Pengadaan</TabsTrigger>
          <TabsTrigger value="gallery">Galeri Proyek</TabsTrigger>
          <TabsTrigger value="members">Karyawan</TabsTrigger>
          <TabsTrigger value="security">Ganti Password</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" />
                Informasi Utama
              </CardTitle>
              <CardDescription>Detail kontak dan identitas perusahaan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Perusahaan</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: PT Inti Nusa Dinamika" />
                </div>
                <div className="space-y-2">
                  <Label>NPWP Perusahaan</Label>
                  <Input value={npwpNumber} onChange={e => setNpwpNumber(e.target.value)} placeholder="00.000.000.0-000.000" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Alamat Lengkap</Label>
                  <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Jalan Raya No. 123..." />
                </div>
                <div className="space-y-2">
                  <Label>Nomor Telepon</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="021-..." />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="info@perusahaan.com" />
                </div>
                <div className="space-y-2">
                  <Label>Nama PIC</Label>
                  <Input value={picName} onChange={e => setPicName(e.target.value)} placeholder="Nama penanggung jawab" />
                </div>
                <div className="space-y-2">
                  <Label>Telepon PIC</Label>
                  <Input value={picPhone} onChange={e => setPicPhone(e.target.value)} placeholder="Nomor HP / WhatsApp" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dokumen & File (Max 2MB)</CardTitle>
              <CardDescription>Unggah logo, kop surat, dan dokumen legalitas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-2 border p-3 rounded-md bg-muted/10 relative">
                  <Label>Logo Perusahaan</Label>
                  <Input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] || null)} />
                  {logoUrl && (
                    <Button type="button" variant="link" size="sm" className="absolute top-1 right-2 text-blue-600 p-0" onClick={() => window.open(logoUrl, '_blank')}>
                      <Eye className="w-3 h-3"/> Lihat Logo
                    </Button>
                  )}
                </div>

                <div className="space-y-2 border p-3 rounded-md bg-muted/10 relative">
                  <Label>Kop Surat</Label>
                  <Input type="file" accept="image/*,.pdf" onChange={e => setKopFile(e.target.files?.[0] || null)} />
                  {kopUrl && (
                    <Button type="button" variant="link" size="sm" className="absolute top-1 right-2 text-blue-600 p-0" onClick={() => window.open(kopUrl, '_blank')}>
                      <Eye className="w-3 h-3"/> Lihat Kop
                    </Button>
                  )}
                </div>

                <div className="space-y-2 border p-3 rounded-md bg-muted/10 relative">
                  <Label>File NIB</Label>
                  <Input type="file" accept=".pdf,image/*" onChange={e => setNibFile(e.target.files?.[0] || null)} />
                  {nibUrl && (
                    <Button type="button" variant="link" size="sm" className="absolute top-1 right-2 text-blue-600 p-0" onClick={() => window.open(nibUrl, '_blank')}>
                      <Eye className="w-3 h-3"/> Lihat NIB
                    </Button>
                  )}
                </div>

                <div className="space-y-2 border p-3 rounded-md bg-muted/10 relative">
                  <Label>File NPWP</Label>
                  <Input type="file" accept=".pdf,image/*" onChange={e => setNpwpFile(e.target.files?.[0] || null)} />
                  {npwpUrl && (
                    <Button type="button" variant="link" size="sm" className="absolute top-1 right-2 text-blue-600 p-0" onClick={() => window.open(npwpUrl, '_blank')}>
                      <Eye className="w-3 h-3"/> Lihat NPWP
                    </Button>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2 border p-3 rounded-md bg-muted/10 relative">
                  <Label>Akta Perusahaan</Label>
                  <Input type="file" accept=".pdf,image/*" onChange={e => setAktaFile(e.target.files?.[0] || null)} />
                  {aktaUrl && (
                    <Button type="button" variant="link" size="sm" className="absolute top-1 right-2 text-blue-600 p-0" onClick={() => window.open(aktaUrl, '_blank')}>
                      <Eye className="w-3 h-3"/> Lihat Akta
                    </Button>
                  )}
                </div>

              </div>
              <div className="pt-4 flex justify-end">
                <Button onClick={handleSaveProfile} disabled={loading} className="bg-violet-600 hover:bg-violet-700 text-white">
                  {loading ? 'Menyimpan...' : <><Save className="w-4 h-4" /> Simpan Perubahan</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Daftar Karyawan
                </CardTitle>
                <CardDescription>Kelola data karyawan & teknisi.</CardDescription>
              </div>
              <Button size="sm" onClick={() => openEmpModal()} className="bg-violet-600 hover:bg-violet-700">
                <Plus className="w-4 h-4" /> Tambah Karyawan
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {employees.length === 0 ? (
                <div className="h-48 m-6 flex flex-col items-center justify-center text-muted-foreground border border-dashed rounded-lg px-4 text-center">
                  <Users className="w-8 h-8 mb-2 text-muted-foreground/50" />
                  <p className="font-medium text-foreground">Belum ada data karyawan</p>
                  <p className="text-sm">Tambahkan karyawan pertama Anda untuk memulai.</p>
                </div>
              ) : (
                <>
                  {/* ===== MOBILE: Card list ===== */}
                  <div className="md:hidden divide-y divide-border border-t border-border">
                    {employees.map((emp) => (
                      <div key={emp.id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm">{emp.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{emp.employeeId}</p>
                          </div>
                          {emp.isActive ? (
                            <Badge variant="outline" className="shrink-0 bg-emerald-50 text-emerald-600">Aktif</Badge>
                          ) : (
                            <Badge variant="outline" className="shrink-0 bg-rose-50 text-rose-600">Non-Aktif</Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="min-w-0">
                            <p className="text-muted-foreground">Jabatan</p>
                            <p className="truncate mt-0.5">{emp.position || '-'}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-muted-foreground">No HP</p>
                            <p className="truncate mt-0.5">{emp.phone || '-'}</p>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <Button variant="outline" size="sm" className="h-9" onClick={() => openEmpModal(emp)}>
                            <Edit className="w-4 h-4 text-blue-600" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteEmployee(emp.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ===== DESKTOP: Tabel ===== */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID / NIK</TableHead>
                          <TableHead>Nama Karyawan</TableHead>
                          <TableHead>Jabatan</TableHead>
                          <TableHead>No HP</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-center">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employees.map(emp => (
                          <TableRow key={emp.id}>
                            <TableCell className="font-medium">{emp.employeeId}</TableCell>
                            <TableCell>{emp.name}</TableCell>
                            <TableCell>{emp.position || '-'}</TableCell>
                            <TableCell>{emp.phone || '-'}</TableCell>
                            <TableCell className="text-center">
                              {emp.isActive ? <Badge variant="outline" className="bg-emerald-50 text-emerald-600">Aktif</Badge> : <Badge variant="outline" className="bg-rose-50 text-rose-600">Non-Aktif</Badge>}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => openEmpModal(emp)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600" onClick={() => handleDeleteEmployee(emp.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB: Kanal Pengadaan Berizin ─── */}
        <TabsContent value="channels" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Link2 className="w-5 h-5 text-primary" />
                Tautan Kanal Pengadaan Berizin
              </CardTitle>
              <CardDescription>
                Tautan ini akan langsung terhubung ke kartu kanal di Landing Page, sehingga klien dan instansi dapat langsung mengunjungi etalase pengadaan resmi Anda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveChannels} className="space-y-6">
                {channelsSuccess && (
                  <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center gap-2.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{channelsSuccess}</span>
                  </div>
                )}
                {channelsError && (
                  <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2.5 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{channelsError}</span>
                  </div>
                )}

                <div className="grid gap-6">
                  {/* Siplah */}
                  <div className="p-4 rounded-xl border bg-card/60 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                          {siplahIcon ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={siplahIcon} alt="Icon Siplah" className="w-full h-full object-contain p-1" />
                          ) : (
                            <span className="text-primary font-bold text-sm">S</span>
                          )}
                        </div>
                        <div>
                          <Label className="text-sm font-semibold">Kanal Siplah (Kemdikbud)</Label>
                          <p className="text-xs text-muted-foreground">Platform e-Pengadaan Sekolah & Instansi Pendidikan</p>
                        </div>
                      </div>
                      {siplahUrl && (
                        <a
                          href={siplahUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Tes Tautan
                        </a>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">URL Tautan Etalase</Label>
                        <Input
                          type="url"
                          value={siplahUrl}
                          onChange={(e) => setSiplahUrl(e.target.value)}
                          placeholder="https://siplah.kemdikbud.go.id/..."
                          className="font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Icon / Logo Kanal</Label>
                        <div className="flex gap-2">
                          <label className="cursor-pointer shrink-0">
                            <span className="inline-flex items-center px-3 py-2 rounded-md bg-muted hover:bg-muted/80 text-xs font-medium border transition-colors">
                              <Upload className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                              {uploadingChannel === 'siplah' ? 'Mengunggah...' : 'Upload Icon'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingChannel === 'siplah'}
                              onChange={(e) => {
                                const f = e.target.files?.[0]
                                if (f) handleUploadChannelIcon('siplah', f)
                              }}
                            />
                          </label>
                          <Input
                            type="url"
                            value={siplahIcon}
                            onChange={(e) => setSiplahIcon(e.target.value)}
                            placeholder="Atau URL gambar icon"
                            className="font-mono text-xs flex-1"
                          />
                          {siplahIcon && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setSiplahIcon('')}
                              className="text-destructive px-2"
                              title="Hapus icon"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* eKatalog */}
                  <div className="p-4 rounded-xl border bg-card/60 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                          {ekatalogIcon ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={ekatalogIcon} alt="Icon eKatalog" className="w-full h-full object-contain p-1" />
                          ) : (
                            <span className="text-primary font-bold text-sm">E</span>
                          )}
                        </div>
                        <div>
                          <Label className="text-sm font-semibold">Kanal e-Katalog (LKPP)</Label>
                          <p className="text-xs text-muted-foreground">Platform Pengadaan Nasional Pemerintah</p>
                        </div>
                      </div>
                      {ekatalogUrl && (
                        <a
                          href={ekatalogUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Tes Tautan
                        </a>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">URL Tautan Etalase</Label>
                        <Input
                          type="url"
                          value={ekatalogUrl}
                          onChange={(e) => setEkatalogUrl(e.target.value)}
                          placeholder="https://e-katalog.lkpp.go.id/..."
                          className="font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Icon / Logo Kanal</Label>
                        <div className="flex gap-2">
                          <label className="cursor-pointer shrink-0">
                            <span className="inline-flex items-center px-3 py-2 rounded-md bg-muted hover:bg-muted/80 text-xs font-medium border transition-colors">
                              <Upload className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                              {uploadingChannel === 'ekatalog' ? 'Mengunggah...' : 'Upload Icon'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingChannel === 'ekatalog'}
                              onChange={(e) => {
                                const f = e.target.files?.[0]
                                if (f) handleUploadChannelIcon('ekatalog', f)
                              }}
                            />
                          </label>
                          <Input
                            type="url"
                            value={ekatalogIcon}
                            onChange={(e) => setEkatalogIcon(e.target.value)}
                            placeholder="Atau URL gambar icon"
                            className="font-mono text-xs flex-1"
                          />
                          {ekatalogIcon && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setEkatalogIcon('')}
                              className="text-destructive px-2"
                              title="Hapus icon"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Padi UMKM */}
                  <div className="p-4 rounded-xl border bg-card/60 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                          {padiUmkmIcon ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={padiUmkmIcon} alt="Icon Padi UMKM" className="w-full h-full object-contain p-1" />
                          ) : (
                            <span className="text-primary font-bold text-sm">P</span>
                          )}
                        </div>
                        <div>
                          <Label className="text-sm font-semibold">Kanal PaDi UMKM</Label>
                          <p className="text-xs text-muted-foreground">Platform Pengadaan BUMN & Ekosistem UMKM</p>
                        </div>
                      </div>
                      {padiUmkmUrl && (
                        <a
                          href={padiUmkmUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Tes Tautan
                        </a>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">URL Tautan Etalase</Label>
                        <Input
                          type="url"
                          value={padiUmkmUrl}
                          onChange={(e) => setPadiUmkmUrl(e.target.value)}
                          placeholder="https://padiumkm.id/..."
                          className="font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Icon / Logo Kanal</Label>
                        <div className="flex gap-2">
                          <label className="cursor-pointer shrink-0">
                            <span className="inline-flex items-center px-3 py-2 rounded-md bg-muted hover:bg-muted/80 text-xs font-medium border transition-colors">
                              <Upload className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                              {uploadingChannel === 'padi' ? 'Mengunggah...' : 'Upload Icon'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingChannel === 'padi'}
                              onChange={(e) => {
                                const f = e.target.files?.[0]
                                if (f) handleUploadChannelIcon('padi', f)
                              }}
                            />
                          </label>
                          <Input
                            type="url"
                            value={padiUmkmIcon}
                            onChange={(e) => setPadiUmkmIcon(e.target.value)}
                            placeholder="Atau URL gambar icon"
                            className="font-mono text-xs flex-1"
                          />
                          {padiUmkmIcon && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setPadiUmkmIcon('')}
                              className="text-destructive px-2"
                              title="Hapus icon"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={channelsLoading} className="min-w-[160px]">
                    <Save className="w-4 h-4 mr-2" />
                    {channelsLoading ? 'Menyimpan...' : 'Simpan Link Kanal'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB: Galeri Rekam Jejak Proyek ─── */}
        <TabsContent value="gallery" className="space-y-6">
          <GalleryModule isEmbedded={true} />
        </TabsContent>

        {/* ─── TAB: Keamanan & Ganti Password ─── */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Ganti Kata Sandi Akun
              </CardTitle>
              <CardDescription>
                Perbarui kata sandi login Anda secara berkala untuk menjaga keamanan data dashboard dan transaksi.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-5 max-w-lg">
                {passSuccessMsg && (
                  <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center gap-2.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{passSuccessMsg}</span>
                  </div>
                )}
                {passErrorMsg && (
                  <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2.5 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{passErrorMsg}</span>
                  </div>
                )}

                {/* Password Saat Ini */}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Password Saat Ini</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Masukkan password yang sedang digunakan"
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Baru */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Password Baru</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Gunakan minimal 6 karakter dengan variasi huruf dan angka.
                  </p>
                </div>

                {/* Konfirmasi Password Baru */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi password baru Anda"
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <Button type="submit" disabled={changePassLoading} className="min-w-[160px]">
                    <KeyRound className="w-4 h-4 mr-2" />
                    {changePassLoading ? 'Menyimpan...' : 'Perbarui Password'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Karyawan */}
      <Dialog open={empModalOpen} onOpenChange={setEmpModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{empForm.id ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}</DialogTitle>
            <DialogDescription>Masukkan detail profil karyawan.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>ID Karyawan / NIK</Label>
              <Input value={empForm.employeeId} onChange={e => setEmpForm({...empForm, employeeId: e.target.value})} placeholder="Biarkan kosong untuk generate otomatis" />
            </div>
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input value={empForm.name} onChange={e => setEmpForm({...empForm, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Jabatan</Label>
              <Input value={empForm.position} onChange={e => setEmpForm({...empForm, position: e.target.value})} placeholder="Contoh: Teknisi, Kasir, Manager" />
            </div>
            <div className="space-y-2">
              <Label>No. HP</Label>
              <Input value={empForm.phone} onChange={e => setEmpForm({...empForm, phone: e.target.value})} />
            </div>
            <div className="flex items-center space-x-2 pt-2 border-t">
              <input type="checkbox" id="isActive" checked={empForm.isActive} onChange={e => setEmpForm({...empForm, isActive: e.target.checked})} className="rounded border-gray-300 text-violet-600 focus:ring-violet-600" />
              <Label htmlFor="isActive">Status Karyawan Aktif</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setEmpModalOpen(false)}>Batal</Button>
            <Button onClick={handleSaveEmployee} disabled={loading} className="bg-violet-600 hover:bg-violet-700 text-white">Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
