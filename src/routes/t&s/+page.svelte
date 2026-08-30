<script lang="ts">
import { ArrowLeft, ArrowUp } from "@lucide/svelte";
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
</script>



<div class="p-6 max-w-md mx-auto space-y-5">
  <a href="/" class="btn btn-ghost btn-sm gap-1 pl-0">
    <ArrowLeft class="w-4 h-4" /> Beranda
  </a>
  <h1 class="text-2xl font-bold mx-4">1. Syarat & Ketentuan (Terms of Service)</h1>

<p>Tanggal Efektif: 27 Agustus 2026</p>

<p>Terakhir Diperbarui: 27 Agustus 2026</p>

<p>Selamat datang di aplikasi web kami. Syarat dan Ketentuan ini mengatur penggunaan aplikasi web, layanan pembayaran, dan integrasi perangkat elektronika yang disediakan oleh Prinus Reka (selanjutnya disebut sebagai "<strong>Penyedia</strong>") kepada Pengguna Akhir (selanjutnya disebut "<strong>Pengguna</strong>") dan Pengelola Outlet Terapi (selanjutnya disebut "<strong>Pengelola</strong>").</p>

<p>Dengan melakukan transaksi pembayaran melalui platform kami, Pengguna dianggap telah membaca, memahami, dan menyetujui seluruh ketentuan di bawah ini.</p>

<h2 class="text-xl font-semibold mt-4 mb-2">A. Definisi</h2>

<p><strong>Penyedia:</strong> Pihak penyedia sistem, mencakup aplikasi web, kontroler elektronika, serta pemilik akun Merchant pada Payment Gateway (Midtrans).</p>

<p><strong>Pengelola:</strong> Pihak mitra pemegang/penyedia fisik perangkat terapi yang bekerja sama dengan Penyedia.</p>

<p><strong>Pengguna:</strong> Pihak/konsumen yang menggunakan jasa perangkat terapi dan melakukan pembayaran melalui sistem.</p>

<p><strong>Sistem:</strong> Kesatuan aplikasi web dan alat elektronika pengontrol catu daya yang terhubung secara terintegrasi.</p>

<h2 class="text-xl font-semibold mt-4 mb-2">B. Mekanisme Layanan dan Pembayaran</h2>

    <p>Penyedia menyediakan fasilitas pembayaran non-tunai (seperti QRIS dan metode lain yang didukung) melalui integrasi Midtrans.</p>

    <p>Setiap transaksi yang berhasil diproses oleh sistem akan secara otomatis mengaktifkan catu daya listrik pada perangkat terapi sesuai durasi atau ketentuan nominal transaksi yang dipindai.</p>

    <p>Penyedia bertindak sebagai Merchant resmi di Midtrans yang menerima dana pembayaran transaksi Pengguna, yang selanjutnya diproses sesuai kesepakatan bagi hasil antara Penyedia dan Pengelola.</p>

<h2 class="text-xl font-semibold mt-4 mb-2">C. Kewajiban & Tanggung Jawab</h2>

    <p>Penyedia bertanggung jawab atas keandalan sistem pembayaran web, ketersediaan konektivitas alat elektronika pengontrol catu daya, serta transparansi pencatatan transaksi.</p>

    <p>Pengelola bertanggung jawab penuh atas kelaikan fisik, keamanan teknis, kelayakan medis/fungsi, dan perawatan rutin perangkat terapi yang digunakannya.</p>

    <p>Penyedia tidak bertanggung jawab atas cedera, ketidaknyamanan, atau kerugian fisik yang disebabkan oleh malfungsi mekanis/fungsi dasar dari perangkat terapi milik Pengelola.</p>

<h1 id="refund-service-policy" class="text-2xl font-bold mt-6 mb-4">2. Kebijakan Pengembalian Dana & Operasional (Refund & Service Policy)</h1>
<h2 class="text-xl font-semibold mt-4 mb-2">A. Pembatalan & Pengembalian Dana (Refund)</h2>

    <p>Kegagalan Aktivasi Alat: Apabila transaksi pembayaran telah terkonfirmasi BERHASIL/SUCCESS oleh sistem/Midtrans, namun alat elektronika gagal mengaktifkan catu daya perangkat terapi akibat gangguan koneksi atau teknis sistem, Pengguna berhak mengajukan pengembalian dana (refund) penuh atau aktivasi ulang manual.</p>

    <p>Kesalahan Pengguna: Pembayaran yang telah berhasil diproses tidak dapat dibatalkan atau dikembalikan jika perangkat terapi telah aktif dan berfungsi sebagaimana mestinya.</p>

    <p><strong>Prosedur Pengajuan Refund:</strong></p>

        <p>Pengguna wajib menghubungi Layanan Pelanggan Penyedia melalui kontak yang tertera dengan melampirkan bukti transaksi (screenshot/detail pembayaran) serta informasi lokasi alat.</p>

        <p>Proses verifikasi dan pengembalian dana akan diproses dalam waktu 1–3 hari kerja ke rekening/sumber pembayaran awal Pengguna.</p>

<h2 class="text-xl font-semibold mt-4 mb-2">B. Penghentian Layanan Sementara</h2>

    <p>Penyedia berhak menghentikan akses jaringan pada alat elektronika jika sedang dilakukan pemeliharaan sistem (maintenance) atau terjadi keadaan memaksa (force majeure).</p>
<h1 class="text-2xl font-bold mt-6 mb-4">3. Kebijakan Privasi (Privacy Policy)</h1>

<p>Penyedia menghargai privasi seluruh Pengguna dan Pengelola. Kebijakan Privasi ini menjelaskan bagaimana informasi Anda dikumpulkan, digunakan, dan dilindungi.</p>
<h2 class="text-xl font-semibold mt-4 mb-2">A. Informasi yang Dikumpulkan</h2>

    <p>Data Transaksi: ID transaksi, nominal pembayaran, metode pembayaran (QRIS/E-Wallet/Bank), waktu transaksi, dan status aktivasi perangkat.</p>

    <p><strong>Data Perangkat:</strong> Informasi statistik penggunaan sistem dan telemetry alat elektronika pengontrol.</p>

    <p><strong>Penyedia TIDAK menyimpan data sensitif pembayaran seperti Nomor Kartu Kredit, PIN, atau kata sandi perbankan Pengguna. Seluruh proses pemrosesan data pembayaran dilakukan secara aman melalui enkripsi standar industri oleh payment gateway (Midtrans).</strong></p>

<h2 class="text-xl font-semibold mt-4 mb-2">B. Penggunaan Informasi</h2>

<p>Informasi yang dikumpulkan digunakan semata-mata untuk:</p>

<ol class="list-decimal list-outside space-y-1">
    <li class="list-item">Memproses transaksi pembayaran dan mengaktifkan catu daya perangkat terapi.</li>
    <li class="list-item">Menghitung skema bagi hasil secara akurat antara Penyedia dan Pengelola.</li>
    <li class="list-item">Kebutuhan rekonsiliasi keuangan, audit sistem, dan peningkatan kualitas layanan.</li>
</ol>

<h2 class="text-xl font-semibold mt-4 mb-2">C. Keamanan Data</h2>

<p>Penyedia menerapkan langkah-langkah keamanan teknis dan organisasional untuk melindungi data transaksi dari akses, pengubahan, atau pengungkapan yang tidak sah.</p>
<h1 class="text-2xl font-bold mt-6 mb-4">4. Informasi Kontak & Layanan Bantuan (Contact Us)</h1>

<p>Jika Anda memiliki pertanyaan, kendala transaksi, atau pengajuan pengembalian dana, silakan hubungi kami melalui kontak resmi berikut:</p>

    <p>Nama Usaha/Perusahaan: Prinus Reka</p>

    <p>Alamat Operasional: jl. Pelatuk 2 no 3 Manahan, Banjarsari, Surakarta, Jawa Tengah, Indonesia 57139</p>

    <p>Email Customer Support: pidibox@prinus.net</p>

    <p>WhatsApp / Telepon: +62 8997895139</p>

    <p>Jam Operasional Layanan Bantuan: Senin – Jumat, [08:00 – 20:00 WIB]</p>

    </div>

    <button
  onclick={scrollToTop}
  class="fixed bottom-4 right-4 z-50 btn btn-circle btn-primary shadow-lg"
  aria-label="Kembali ke atas"
>
  <ArrowUp class="w-5 h-5" />
</button>