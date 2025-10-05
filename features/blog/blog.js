FeatureHandler.registerFeature('blog', {
  init() {
    const container = document.getElementById('blogContainer');
    container.innerHTML = '';

    const articles = [
      {
        title: '5 Cara Menjaga Kesehatan Mental di Tengah Kesibukan',
        summary: 'Pelajari teknik sederhana untuk menjaga ketenangan dan fokus setiap hari.',
        link: 'https://www.alodokter.com/menjaga-kesehatan-mental'
      },
      {
        title: 'Nutrisi Seimbang untuk Tubuh yang Bugar',
        summary: 'Panduan makan sehat yang mudah diterapkan untuk gaya hidup aktif.',
        link: 'https://hellosehat.com/nutrisi/nutrisi-umum/makanan-sehat/'
      },
      {
        title: 'Fashion Sesuai Bentuk Tubuh: Tips & Trik',
        summary: 'Kenali gaya berpakaian yang paling cocok untuk bentuk tubuhmu.',
        link: 'https://theconceptwardrobe.com/build-a-wardrobe/body-shape-guide'
      },
      {
        title: 'Mindful Living: Hidup Lebih Sadar dan Bermakna',
        summary: 'Latihan mindfulness untuk meningkatkan kualitas hidup dan kebahagiaan.',
        link: 'https://www.psychologytoday.com/us/basics/mindfulness'
      }
    ];

    articles.forEach(article => {
      const card = document.createElement('div');
      card.className = 'blog-card';
      card.innerHTML = `
        <h3>${article.title}</h3>
        <p>${article.summary}</p>
        <a href="${article.link}" target="_blank">Baca Selengkapnya →</a>
      `;
      container.appendChild(card);
    });
  }
});
