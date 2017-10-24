var listenOnMove = true;
var markers = [];
var circle;
var map;
var radius;

$(document).ready(function() {
  initMap();
  initMarkers();

  $('#geolocate').on('click', getLocation);
  $('#search').on('submit', function(event) {
    $('#searchIcon')
        .removeClass('fa-search')
        .addClass('fa-refresh')
        .addClass('fa-spin');
    // process the form
    $.ajax({
      type: 'GET',
      url: $(this).attr('action'),
      data: {
        'search': $('input[name=search]').val()
      },
      dataType: 'json',
      encode: true,
      complete(jqXHR, textStatus) {
        $('#searchIcon')
            .removeClass('fa-refresh')
            .removeClass('fa-spin')
            .addClass('fa-search');
      }
    }).done(function(data) {
      if (data.boundingbox) {
        //listenOnMove = false;
        map.fitBounds([
          [data.boundingbox[1], data.boundingbox[3]],
          [data.boundingbox[0], data.boundingbox[2]]
        ]);
        refreshVideoList(data.videos);
        initMarkers();
        //listenOnMove = true;
      }
    });
    // stop the form from submitting the normal way and refreshing the page
    event.preventDefault();
  });
  $(document).on('click', 'a.videolist-media', function(e) {
    e.preventDefault();
    listenOnMove = false;
    $('#map').addClass('d-none');
    $(this).addClass('visited');
    $('a.videolist-media.active').removeClass('active');
    $(this).addClass('active');
    $('#video-preview').removeClass('d-none')
        .empty()
        .append('<iframe allowfullscreen class="embed-responsive-item" src="https://www.youtube.com/embed/' + $(this).attr('data-youtube-id') + '?rel=0&showinfo=0&autoplay=1" />');
    showMetadata($(this));
    $('#backtomap')
        .removeClass('d-none')
        .on('click', function() {
          $(this).addClass('d-none');
          $('#video-preview').empty().addClass('d-none');
          $('#map').removeClass('d-none');
          $('a.videolist-media.active').removeClass('active');
          hideMetadata();
          if (!isMapOk()) {
            resetMap();
          }
          listenOnMove = true;
        });

    return false;
  });

  function initMap() {
    map = L.map('map', {
      attributionControl: false,
      center: [0, 0],
      zoom: 2,
      maxBounds: [[-90, -180], [90, 180]]
    });
    map.on('moveend', function() {
      if (listenOnMove) {
        localSearchArea(map);
        youtubeSearchArea(map);
      }
    });
    L.tileLayer(
        'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZHJvbmVtYXBpbyIsImEiOiJjajZ0a2U3OGcwczZ6MnJtc2p4Y3F6YjE0In0.kz6URZ6nVfb7dWGE3w_OBA',
        {
          maxZoom: 15,
          id: 'mapbox.streets'
        }
    ).addTo(map);
    L.MakiMarkers.accessToken = mapboxApiToken;
    initMarkers();
  }

  function youtubeSearchArea(map) {
    const MAX_RADIUS = 1000000;
    var bounds = map.getBounds(),
        center = map.getCenter();

    radius = Math.min(
        MAX_RADIUS,
        map.distance(bounds.getNorthWest(), bounds.getNorthEast()) / 2,
        map.distance(bounds.getNorthWest(), bounds.getSouthWest()) / 2
    );
    if (radius > 0) {
      $.ajax({
        type: 'GET',
        url: '/ajax/youtube/area',
        data: {
          'radius': radius,
          'latitude': center.lat,
          'longitude': center.lng
        },
        dataType: 'json',
        encode: true
      }).done(function(data) {
        if (circle) {
          map.removeLayer(circle);
        }
        circle = L.circle(center, radius);
        circle.addTo(map);
        refreshVideoList(data, true);
        initMarkers();
      });
    }
  }

  function initMarkers() {
    markers.map(function(marker) {
      map.removeLayer(marker);
    });
    markers = [];
    $('.videolist-media').each(function() {
      var that = $(this);
      var iconlabel = $(this).attr('data-icon') ? $(this).attr('data-icon') : 'star';
      var color = $(this).hasClass('premiumvid') ? '#ffc107' : '#fe0000';
      var size = $(this).hasClass('premiumvid') ? 'm' : 's';
      var icon = L.MakiMarkers.icon({icon: iconlabel, color: color, size: size});
      var marker = L.marker(
          [$(this).attr('data-latitude'), $(this).attr('data-longitude')],
          {
            title: $(this).attr('data-title'),
            icon: icon
          }
      );
      marker.on('click', function() {
        $('#videolist-list').animate({
          scrollTop: $(that).position().top + $(that).parent().scrollTop() - $(that).parent().position().top
        }, 500);

        that.trigger('click');
      });
      marker.addTo(map);
      markers.push(marker);
    });
  }

  function refreshVideoList(videos, youtube) {
    if (youtube) {
      $('.youtube-media').remove();
    } else {
      $('#videolist-list').empty();
    }
    $.each(videos, function(index, video) {
      var timeago = moment(video.date).fromNow();
      var media = $('<a>').attr({
        'class': 'media video videolist-media list-group-item list-group-item-action',
        'data-youtube-id': video.youtubeId,
        'data-latitude': video.place.location.coordinates[1],
        'data-longitude': video.place.location.coordinates[0],
        'data-title': video.title,
        'data-description': video.description,
        'data-tags': video.tags,
        'data-icon': video.icon,
        'data-publisher': video.publisher.username,
        'data-timeago': timeago
      });
      if (youtube) {
        media.addClass('youtube-media');
        media.attr('href', 'javascript:void(0);');
      } else {
        media.addClass('premiumvid');
        media.attr('data-id', video._id);
        media.attr('href', '/videos/' + video._id);
      }
      var place = [video.place.name, video.place.city, video.place.state, video.place.country].filter(String);
      if (place.length) {
        media.attr('data-place', place.join(', '));
      }
      media.append(
          $('<img/>').attr({
            'class': 'd-flex mr-2 img-fluid',
            'src': 'https://img.youtube.com/vi/' + video.youtubeId + '/hqdefault.jpg',
            'alt': video.title
          })
      );
      var body = $('<div class="media-body"/>')
          .append($('<h5 class="h6 videolist-title"/>').text(video.title))
          .append(
              $('<div class="row" />')
                  .append($('<h6 class="videolist-footer col-7 pr-0"/>').text(video.publisher.username))
                  .append($('<h6 class="videolist-footer text-right col-5 pl-0" />').text(timeago))
          );
      media.append(body);
      if (!youtube) {
        media.append(
            $('<span class=\'badge badge-warning float-right mb-auto\'/>').html('<i class=\'fa fa-star\' title=\'Community video\' />')
        );
      }
      $('#videolist-list').append(media);
    });
  }

  function resetMap() {
    map.remove();
    initMap();
  }

  function isMapOk() {
    return map.getSize().x !== 0;
  }

  function localSearchArea(map) {
    var bounds = map.getBounds();
    $.ajax({
      type: 'GET',
      url: '/ajax/bounds',
      data: {
        'south': bounds.getSouth(),
        'west': bounds.getWest(),
        'north': bounds.getNorth(),
        'east': bounds.getEast()
      },
      dataType: 'json',
      encode: true
    }).done(function(data) {
      refreshVideoList(data);
      initMarkers();
    });
  }

  function showMetadata(video) {
    var metaviewer = $('#video-metaviewer');
    metaviewer.empty().removeClass('d-none');
    metaviewer.append($('<h1 class="lead"/>').text(video.attr('data-title')));
    if (video.attr('data-place')) {
      metaviewer.append(
          $('<h2 class="h6 mt-3"/>')
              .append($('<i class="fa fa-map-marker mr-1"/>'))
              .append(video.attr('data-place'))
      );
    }
    metaviewer.append(
        $('<p class="small"/>').text('Uploaded ' + video.attr('data-timeago')).prepend('<i class="fa fa-clock-o mr-1"/>')
    );
    metaviewer.append($('<hr/>'));
    metaviewer.append(
        $('<p class="mt-3 small"/>').html(video.attr('data-description').replace(/(?:\r\n|\r|\n)/g, '<br />'))
    );
    if (video.attr('data-tags')) {
      var tmp = video.attr('data-tags').split(',').map(Function.prototype.call, String.prototype.trim).filter(String);
      metaviewer.append($('<hr/>'));
      let tags = '';
      for (let i = 0, len = tmp.length; i < len; i++) {
        tags += '<span class=\'badge badge-secondary mr-1\'><i class=\'fa fa-tag mr-1\'></i>' + tmp[i] + '</span>';
      }
      metaviewer.append($('<div class="mt-3"/>').html(tags));
    }

  }

  function hideMetadata() {
    $('#video-metaviewer').empty().addClass('d-none');
  }

  function getLocation() {
    if (navigator.geolocation) {
      disableGeoloc();
      navigator.geolocation.getCurrentPosition(function(position) {
        reverseGeocoding(position.coords.latitude, position.coords.longitude, function(address) {
          var location = [address.suburb, address.town, address.state, address.country]
              .filter(function(element) {
                return element !== undefined;
              })
              .join(', ');
          $('#place').val(location);
          $('#search').trigger('submit');
        }, function() {
          enableGeoloc();
        });
      }, function showError(error) {
        var message;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'User denied the request for Geolocation.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            message = 'The request to get user location timed out.';
            break;
          case error.UNKNOWN_ERROR:
            message = 'An unknown error occurred.';
            break;
        }
        if (Notification.permission === 'granted') {
          Notification(message);
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission(function(permission) {
            if (!('permission' in Notification)) {
              Notification.permission = permission;
            }
            if (permission === 'granted') {
              Notification(message);
            }
          });
        }
        // removeGeoloc();
      });
    } else {
      Notification('Geolocation is not supported by this browser.');
      removeGeoloc();
    }
  }

  function removeGeoloc() {
    $('#geolocate').remove();
  }

  function disableGeoloc() {
    $('#geolocate')
        .prop('disabled', true)
        .find('>i')
        .removeClass('fa-location-arrow')
        .addClass('fa-spin')
        .addClass('fa-circle-o-notch')
    ;
  }

  function enableGeoloc() {
    $('#geolocate').prop('disabled', false)
        .find('>i')
        .removeClass('fa-spin')
        .removeClass('fa-circle-o-notch')
        .addClass('fa-location-arrow')
    ;
  }

  function reverseGeocoding(lat, lon, success, complete) {
    var requestURL = 'https://nominatim.openstreetmap.org/reverse?format=json&accept-language=en&lat=' + lat + '&lon=' + lon;
    var request = new XMLHttpRequest();
    request.open('GET', requestURL);
    request.responseType = 'json';
    request.send();
    request.onload = function() {
      success(request.response.address);
    };
    request.onloadend = function() {
      complete();
    };
  }

});