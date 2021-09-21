(function() {
'use strict';

  let currentInstance = null;

  function VimeoAPI(url) {
    return new Promise(function(resolve) {
      if (!url) {
        return resolve(false);
      }
      // create iframe for youtube
      let html = '<iframe src="' + url + '" class="embed-responsive-item" allowfullscreen></iframe>';
      resolve(html);
    });
  }

  function YoutubeAPI(url) {
    return new Promise(function(resolve) {
      if (!url) {
        return resolve(false);
      }
      url = url.replace('watch?v=', 'embed/');
      // create iframe for youtube
      let html = '<iframe type="text/html" src="' + url + '" class="embed-responsive-item" allowfullscreen=""></iframe>';
      resolve(html);
    });
  }

  function KalturaAPI(url) {
    return new Promise(function(resolve) {
      if (!url) {
        return resolve(false);
      }
      // create iframe for kaltura
      let html = '<div class="videoWrapper"><iframe src="' + url + '" class="embed-responsive-item" allowfullscreen ></iframe></div>';
      resolve(html);
    });
  }

  function YoutuAPI(url) {
    if (!url) {
      return resolve(false);
    }
    url = url.replace('youtu.be/', 'youtube.com/watch?v=');
    return YoutubeAPI(url);
  }

  const APIS = {
    'player.vimeo.com': VimeoAPI,
    'youtu.be': YoutuAPI,
    'www.youtube.com': YoutubeAPI,
    'cdnapisec.kaltura.com': KalturaAPI
  };

  function loadFrame(link) {
    return Promise.resolve(link).then(function(link) {
      let url = new URL(link);
      // find proper api from api list
      const loader = APIS[url.hostname];
      return loader && loader(link);
    }).catch(console.warn);
  }

  function CustomVideoView(container) {
    if (!container) {
      return false;
    }
    const anchor = container.querySelector('a');
    if (!anchor || !/player.vimeo.com|youtube.com|youtu.be|cdnapisec.kaltura.com/i.test(anchor.href)) {
      return false;
    }

    let links = [anchor.href];
    // parse metadata
    const rows = document.querySelectorAll('tr[class*=metadatarow]');
    Array.from(rows).forEach(function(row) {
      // find a description field
      if (row.firstChild.textContent === 'Description') {
        links = links.concat(row.lastChild.textContent.split(','));
      }
    });

    // create container for iFrames
    const frameContainer = document.createElement('div');
    frameContainer.classList.add('embed-responsive', 'embed-responsive-16by9');

    const mount = function() {
      const reqs = links.map(function(link) {
        return loadFrame(link);
      });

      Promise.all(reqs).then(function(reps) {
        // hide original viewer
        container.className += ' hide';
        document.querySelector('div.preview').style.display = 'block';
        // add each frames to one root
        reps.forEach(function(embeddedHTML) {
          embeddedHTML && (frameContainer.innerHTML += embeddedHTML);
        });
        // insert it
        container.parentNode.insertBefore(frameContainer, container);
      });
    };

    const unmount = function() {
      frameContainer.parentNode && frameContainer.parentNode.removeChild(frameContainer);
    };

    mount();

    return {unmount: unmount};

  }

  document.addEventListener('cdm-item-page:ready', function(e) {
    if (e.detail.collectionId === 'OUR') {
      // unmount or remove current video player from DOM if it is exists
      currentInstance && currentInstance.unmount();
      // creates a new instance if it is url item and it is from vimeo.com
      currentInstance = CustomVideoView(document.querySelector('div[class*=itemUrl]'));
    }
  });

  document.addEventListener('cdm-item-page:update', function(e) {
    if (e.detail.collectionId === 'OUR') {
      currentInstance && currentInstance.unmount();
      // updates an instance if it is url item and it is from vimeo.com
      currentInstance = CustomVideoView(document.querySelector('div[class*=itemUrl]'));
    }
  });

  document.addEventListener('cdm-item-page:leave', function(e) {
    if (e.detail.collectionId === 'OUR') {
      // unmount or remove current video player from DOM if it is exists
      currentInstance && currentInstance.unmount();
    }
  });

})();
