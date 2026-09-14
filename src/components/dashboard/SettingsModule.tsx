'use client'

import { useState, useEffect } from 'react'
import { Save, Building, Users, Eye, Plus, Trash2, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

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
        logoFile: currentLogo, kopFile: currentKop, nibFile: currentNib, npwpFile: currentNpwp, aktaFile: currentAkta
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
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Pengaturan Perusahaan</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola profil, dokumen legalitas, dan karyawan perusahaan.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full sm:w-[400px] grid-cols-2">
          <TabsTrigger value="profile">Profil & Dokumen</TabsTrigger>
          <TabsTrigger value="members">Karyawan</TabsTrigger>
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
                      <Eye className="w-3 h-3 mr-1"/> Lihat Logo
                    </Button>
                  )}
                </div>

                <div className="space-y-2 border p-3 rounded-md bg-muted/10 relative">
                  <Label>Kop Surat</Label>
                  <Input type="file" accept="image/*,.pdf" onChange={e => setKopFile(e.target.files?.[0] || null)} />
                  {kopUrl && (
                    <Button type="button" variant="link" size="sm" className="absolute top-1 right-2 text-blue-600 p-0" onClick={() => window.open(kopUrl, '_blank')}>
                      <Eye className="w-3 h-3 mr-1"/> Lihat Kop
                    </Button>
                  )}
                </div>

                <div className="space-y-2 border p-3 rounded-md bg-muted/10 relative">
                  <Label>File NIB</Label>
                  <Input type="file" accept=".pdf,image/*" onChange={e => setNibFile(e.target.files?.[0] || null)} />
                  {nibUrl && (
                    <Button type="button" variant="link" size="sm" className="absolute top-1 right-2 text-blue-600 p-0" onClick={() => window.open(nibUrl, '_blank')}>
                      <Eye className="w-3 h-3 mr-1"/> Lihat NIB
                    </Button>
                  )}
                </div>

                <div className="space-y-2 border p-3 rounded-md bg-muted/10 relative">
                  <Label>File NPWP</Label>
                  <Input type="file" accept=".pdf,image/*" onChange={e => setNpwpFile(e.target.files?.[0] || null)} />
                  {npwpUrl && (
                    <Button type="button" variant="link" size="sm" className="absolute top-1 right-2 text-blue-600 p-0" onClick={() => window.open(npwpUrl, '_blank')}>
                      <Eye className="w-3 h-3 mr-1"/> Lihat NPWP
                    </Button>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2 border p-3 rounded-md bg-muted/10 relative">
                  <Label>Akta Perusahaan</Label>
                  <Input type="file" accept=".pdf,image/*" onChange={e => setAktaFile(e.target.files?.[0] || null)} />
                  {aktaUrl && (
                    <Button type="button" variant="link" size="sm" className="absolute top-1 right-2 text-blue-600 p-0" onClick={() => window.open(aktaUrl, '_blank')}>
                      <Eye className="w-3 h-3 mr-1"/> Lihat Akta
                    </Button>
                  )}
                </div>

              </div>
              <div className="pt-4 flex justify-end">
                <Button onClick={handleSaveProfile} disabled={loading} className="bg-violet-600 hover:bg-violet-700 text-white">
                  {loading ? 'Menyimpan...' : <><Save className="w-4 h-4 mr-2" /> Simpan Perubahan</>}
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
                <Plus className="w-4 h-4 mr-2" /> Tambah Karyawan
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {employees.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground m-6 border border-dashed rounded-lg">
                  <Users className="w-8 h-8 mb-2 text-muted-foreground/50" />
                  <p>Belum ada data karyawan</p>
                </div>
              ) : (
                <>
                  {/* ===== MOBILE: Card list ===== */}
                  <div className="md:hidden divide-y divide-border">
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
                            <Edit className="w-4 h-4 mr-1.5 text-blue-600" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 text-rose-600 hover:bg-rose-50"
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
