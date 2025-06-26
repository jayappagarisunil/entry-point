$(document).ready(function () {
  // Toggle mobile menu
  $('#mobile-menu-button').on('click', function () {
    $('#mobile-nav-menu').toggleClass('hidden');
    $('#menu-icon').toggleClass('hidden');
    $('#close-icon').toggleClass('hidden');
  });

  $('.mobile-nav-link').on('click', function () {
    $('#mobile-nav-menu').addClass('hidden');
    $('#menu-icon').removeClass('hidden');
    $('#close-icon').addClass('hidden');
  });

  $('#current-year').text(new Date().getFullYear());

  function isInViewport(element) {
    var elementTop = $(element).offset().top;
    var elementBottom = elementTop + $(element).outerHeight();
    var viewportTop = $(window).scrollTop();
    var viewportBottom = viewportTop + $(window).height();
    var triggerOffset = 100;
    return elementBottom > viewportTop + triggerOffset && elementTop < viewportBottom - triggerOffset;
  }

  function handleScrollAnimations() {
    $('.animate-on-scroll').each(function () {
      if (isInViewport(this) && !$(this).data('animated')) {
        $(this).removeClass('opacity-0 visibility-hidden')
          .addClass($(this).data('animation-class'))
          .data('animated', true);
      }
    });
  }

  // Set animation data attributes
  $('#features h2').data('animation-class', 'animate__fadeInDown');
  $('#features .grid > div:nth-child(1)').data('animation-class', 'animate__fadeInLeft');
  $('#features .grid > div:nth-child(2)').data('animation-class', 'animate__fadeInUp animate__delay-0-5s');
  $('#features .grid > div:nth-child(3)').data('animation-class', 'animate__fadeInRight animate__delay-1s');

  $('#app-images h2').data('animation-class', 'animate__fadeInDown');
  $('#app-images p.text-lg').data('animation-class', 'animate__fadeInUp animate__delay-0-5s');
  $('#app-images .grid > div:nth-child(1)').data('animation-class', 'animate__fadeInUp');
  $('#app-images .grid > div:nth-child(2)').data('animation-class', 'animate__fadeInDown animate__delay-0-3s');
  $('#app-images .grid > div:nth-child(3)').data('animation-class', 'animate__fadeInUp animate__delay-0-6s');
  $('#app-images .grid > div:nth-child(4)').data('animation-class', 'animate__fadeInLeft animate__delay-0-9s');
  $('#app-images .grid > div:nth-child(5)').data('animation-class', 'animate__fadeInRight animate__delay-1-2s');
  $('#app-images .grid > div:nth-child(6)').data('animation-class', 'animate__fadeInUp animate__delay-1-5s');

  $('#reviews h2').data('animation-class', 'animate__fadeInDown');
  $('#reviews p.text-lg').data('animation-class', 'animate__fadeInUp animate__delay-0-5s');
  $('#reviews .grid > div:nth-child(1)').data('animation-class', 'animate__fadeInLeft');
  $('#reviews .grid > div:nth-child(2)').data('animation-class', 'animate__fadeInRight animate__delay-0-5s');
  $('#reviews .grid > div:nth-child(3)').data('animation-class', 'animate__fadeInLeft animate__delay-0-7s');
  $('#reviews .grid > div:nth-child(4)').data('animation-class', 'animate__fadeInRight animate__delay-1s');

  $('#contact h2').data('animation-class', 'animate__fadeInDown');
  $('#contact .flex > div:nth-child(1)').data('animation-class', 'animate__fadeInLeft');
  $('#contact .flex > div:nth-child(2)').data('animation-class', 'animate__fadeInRight');
  $('#contact ul li:nth-child(1)').data('animation-class', 'animate__fadeInUp animate__delay-1s');
  $('#contact ul li:nth-child(2)').data('animation-class', 'animate__fadeInUp animate__delay-1-2s');
  $('#contact ul li:nth-child(3)').data('animation-class', 'animate__fadeInUp animate__delay-1-4s');
  $('#contact form > div:nth-child(1)').data('animation-class', 'animate__fadeInUp animate__delay-0-5s');
  $('#contact form > div:nth-child(2)').data('animation-class', 'animate__fadeInUp animate__delay-0-7s');
  $('#contact form > div:nth-child(3)').data('animation-class', 'animate__fadeInUp animate__delay-0-9s');
  $('#contact form button').data('animation-class', 'animate__bounceIn animate__delay-1-1s');

  $('#login h2').data('animation-class', 'animate__fadeInDown');
  $('#login p.text-lg').data('animation-class', 'animate__fadeInUp animate__delay-0-5s');
  $('#login form > div:nth-child(1)').data('animation-class', 'animate__fadeInUp animate__delay-0-5s');
  $('#login form > div:nth-child(2)').data('animation-class', 'animate__fadeInUp animate__delay-0-7s');
  $('#login form button').data('animation-class', 'animate__bounceIn animate__delay-1s');
  $('#login form p.text-sm').data('animation-class', 'animate__fadeInUp animate__delay-1-2s');

  $('footer').data('animation-class', 'animate__fadeInUp');
  $('footer div.mt-4').data('animation-class', 'animate__fadeInUp animate__delay-0-5s');

  handleScrollAnimations();
  $(window).on('scroll', handleScrollAnimations);
});



ocument.addEventListener('DOMContentLoaded', function () {
  const contactForm = document.getElementById('contact-form');
  if (!contactForm) return;

  contactForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const message = document.getElementById('contact-message').value.trim();

    if (!name || !email || !message) {
      alert('Please fill in all fields.');
      return;
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, message })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Your message has been sent!');
        contactForm.reset();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Form submit failed:', error);
      alert('Something went wrong. Please try again later.');
    }
  });
});

