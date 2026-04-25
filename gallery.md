---
layout: default
title: Gallery
permalink: /gallery/
---

<div class="page-header">
  <h1>Gallery</h1>
  <p>Moments from CADI Lab: conferences, team events, and research milestones.</p>
</div>

<div class="container page-content">

  {% assign all_events = site.gallery_events | sort: "date" | reverse %}

  {% if all_events.size > 0 %}

    {% comment %} Group by category, ordered. {% endcomment %}
    {% assign category_order = "awards|events|conferences|talks" | split: "|" %}
    {% for cat in category_order %}
      {% assign cat_events = all_events | where: "category", cat %}
      {% if cat_events.size > 0 %}
        <h2 class="gallery-category" id="{{ cat }}">{{ cat }}</h2>
        <div class="gallery-grid">
          {% for ev in cat_events %}
            <a href="{{ ev.url | relative_url }}" class="event-card">
              {% if ev.img %}
                <img src="{{ ev.img | relative_url }}" alt="{{ ev.title }}" loading="lazy">
              {% endif %}
              <div class="event-card-body">
                <h3 class="event-card-title">{{ ev.title }}</h3>
                {% if ev.description %}
                  <p class="event-card-desc">{{ ev.description }}</p>
                {% endif %}
                {% if ev.date %}
                  <p class="event-card-date">{{ ev.date | date: "%B %-d, %Y" }}</p>
                {% endif %}
              </div>
            </a>
          {% endfor %}
        </div>
      {% endif %}
    {% endfor %}

    {% comment %} Catch any events whose category isn't in the ordered list. {% endcomment %}
    {% assign known_cats = "awards|events|conferences|talks" | split: "|" %}
    {% assign has_other = false %}
    {% for ev in all_events %}
      {% unless known_cats contains ev.category %}{% assign has_other = true %}{% endunless %}
    {% endfor %}
    {% if has_other %}
      <h2 class="gallery-category" id="other">other</h2>
      <div class="gallery-grid">
        {% for ev in all_events %}
          {% unless known_cats contains ev.category %}
            <a href="{{ ev.url | relative_url }}" class="event-card">
              {% if ev.img %}
                <img src="{{ ev.img | relative_url }}" alt="{{ ev.title }}" loading="lazy">
              {% endif %}
              <div class="event-card-body">
                <h3 class="event-card-title">{{ ev.title }}</h3>
                {% if ev.description %}<p class="event-card-desc">{{ ev.description }}</p>{% endif %}
                {% if ev.date %}<p class="event-card-date">{{ ev.date | date: "%B %-d, %Y" }}</p>{% endif %}
              </div>
            </a>
          {% endunless %}
        {% endfor %}
      </div>
    {% endif %}

  {% else %}

    <div class="gallery-placeholder">
      <i class="fa-solid fa-camera-retro"></i>
      <h3>Photos Coming Soon</h3>
      <p>We're collecting our best moments to share here. Check back soon!</p>
    </div>

  {% endif %}

</div>
