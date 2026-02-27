---
layout: default
title: Join Us
permalink: /join/
---

<div class="page-header">
  <h1>Join CADI Lab</h1>
  <p>We are always looking for motivated students to join our research team.</p>
</div>

<div class="container page-content" style="max-width: 800px;">

<h2 style="margin-top: 2rem; font-size: 1.3rem;">Who We're Looking For</h2>
<p style="color: var(--text-muted); line-height: 1.8; margin-bottom: 1.5rem;">
  CADI Lab welcomes students who are passionate about understanding how digital platforms and technology design affect human behavior and market outcomes. We value intellectual curiosity, methodological rigor, and collaborative spirit.
</p>

<h2 style="font-size: 1.3rem;">Prospective Graduate Students</h2>
<p style="color: var(--text-muted); line-height: 1.8; margin-bottom: 1.5rem;">
  If you are interested in pursuing an M.S. or Ph.D. at National Tsing Hua University under Professor Yoo's supervision, please review the guidelines and research areas on the PI's homepage before reaching out.
</p>

<h2 style="font-size: 1.3rem;">Undergraduate Research Assistants</h2>
<p style="color: var(--text-muted); line-height: 1.8; margin-bottom: 2rem;">
  NTHU undergraduates interested in gaining research experience are encouraged to contact Professor Yoo directly via email.
</p>

<div class="visit-us" style="margin-top: 2rem;">
  <h2 style="font-size: 1.3rem;"><i class="fa-solid fa-location-dot" style="color: var(--secondary); margin-right: 0.4rem;"></i> Visit Us</h2>
  {% assign addr = site.data.lab_members.professor.address %}
  <p style="color: var(--text-muted); line-height: 1.8; margin-bottom: 1rem;">
    {{ addr.line1 }}, {{ addr.line2 }}<br>
    {{ addr.line3 }}, {{ addr.line4 }}
  </p>
  <div style="border-radius: 12px; overflow: hidden; border: 1px solid var(--border);">
    <iframe
      src="https://maps.google.com/maps?q=TSMC+Building,+National+Tsing+Hua+University,+Hsinchu,+Taiwan&t=&z=17&ie=UTF8&iwloc=B&output=embed"
      width="100%"
      height="300"
      style="border:0; display: block;"
      allowfullscreen=""
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade">
    </iframe>
  </div>
</div>

<div class="cta-banner" style="margin-top: 2rem;">
  <h3>Ready to Connect?</h3>
  <p>Please include your CV, transcript, and a brief description of your research interests when reaching out.</p>
  <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
    <a href="mailto:{{ site.pi_email }}" class="btn">
      <i class="fa-solid fa-envelope"></i> Email the PI
    </a>
    <a href="{{ site.pi_homepage }}" target="_blank" class="btn btn-outline">
      <i class="fa-solid fa-globe"></i> PI Homepage
    </a>
  </div>
</div>

</div>
