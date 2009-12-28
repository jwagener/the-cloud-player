/*Copyright (c) 2008 Henrik Berggren & Eric Wahlforss

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

$(function() {
  var justDropped = false, //fixme, ugly replacement for bad callback
      randomPlaylist = parseInt($.cookie('random_playlist')), // read random mode from cookie
      loopPlaylist = parseInt($.cookie('loop_playlist')), // read loop mode from cookie
      volume = parseFloat($.cookie('volume')); // read volume from cookie
      audio = null, // holds the currently playing audio
      audioTracks = {}, // hash for all sound objects
      playlists = {}, // this is the hash of all playlists
      tracks = {}, // this is the hash of all tracks
      colWidths = new Array(20,250,130,50,250,50,100), // default col widths for playlists
      $progress = $('#progress div:first'), // player progress bar
      $loading = $('#progress div.loading'), // player loading bar
      $progressParent = $('#progress');

  if(!volume) {
    volume = 100; // default to max
  }

  if(!randomPlaylist) {
    randomPlaylist = 0;
  }

  // GUI events
  $('#play').click(function() {
    $(document).trigger("onTogglePlay");
  });

  $("#about-box a.close").click(function(ev) {
    $("#about-box").fadeOut();
    ev.preventDefault();
  });

  $("a#about").click(function(ev) {
    $("#about-box").fadeIn();
    ev.preventDefault();
  });
  
  if(randomPlaylist) {
    $("#rand").addClass("on");
  }
  $("#rand").click(function() {
    $(this).toggleClass("on");
    randomPlaylist = ($(this).hasClass("on") ? 1 : 0);
    $.cookie('random_playlist', randomPlaylist);
  });

  // read loop mode from cookie
  if(!loopPlaylist) {
    loopPlaylist = 0;
  }
  if(loopPlaylist) {
    $("#loop").addClass("on");
  }
  $("#loop").click(function() {
    $(this).toggleClass("on");
    loopPlaylist = ($(this).hasClass("on") ? 1 : 0);
    $.cookie('loop_playlist', loopPlaylist);
  });

  // resizable playlists pane
  function withinPlaylistPaneDragArea(el,e) {
    var left = e.clientX-$(el).offset().left-($(el).width()-5);
    if(left > 0 && left < 4) {
      return true;
    } else {
      return false;
    }
  }

  // LISTENERS

  // changing the selection in a playlist
  $(document)
    .bind("onPlaylistSelectionChange",function(e,data) {
      if(data.shiftKey) {
        if($(e.target).siblings(".selected").length > 0) {
          var oldIdx = $("tr",list).index($(e.target).siblings(".selected")[0]);
          var newIdx = $("tr",list).index(e.target);
          var start = (oldIdx - newIdx < 0 ? oldIdx : newIdx);
          var stop = (oldIdx - newIdx < 0 ? newIdx : oldIdx);
          for(var i = start;i <= stop;i++) {
            $("tr",list).eq(i).addClass("selected");              
          }
        }
      } else if (data.metaKey) {
        $(e.target).toggleClass("selected");
      } else {
        $(e.target).siblings().removeClass("selected").end().toggleClass("selected");          
      }
    })
    .bind("onPlaylistOrderChange",function(e,ui,pl) { // change order of a playlist
      console.log('order changed');

      if(justDropped) { // disable sort behavior if dropping in another playlist. ugly, but I can't seem to find a proper callback;
        justDropped = false; // ugly, but I can't find a proper callback;
      } else {
        $(e.target).after(ui.item.parents("tbody").find("tr.selected")); // multi-select-hack, move all selected items to new location
      }

      // update tracks model
      playlists[pl.identifier].tracks = $.map(ui.item.parents("tbody").find("tr:not(.droppable-placeholder)"), function(el, index){
        return $(el).data("track");
      });

      savePlaylist(pl);

    })
    .bind("onLoadTrack",function(e,track) { // load a track into the player
      var id = track.location.substring(track.location.lastIndexOf("/")+1);
      $loading.css('width',"0%");
      $progress.css('width',"0%");
      $("#player-display img.logo").fadeOut('slow');
      $("#progress").fadeIn('slow');

      audioTracks[id] = soundManager.createSound({
        id: id,
        url: track.location,
        volume : volume,
        whileloading : SC.throttle(200,function() {
          $loading.css('width',(audio.bytesLoaded/audio.bytesTotal)*100+"%");
        }),
        whileplaying : SC.throttle(200,function() {
          $progress.css('width',(audio.position/audio.durationEstimate)*100+"%");
          $('#position').html(SC.formatMs(audio.position));
          $('#duration').html(SC.formatMs(audio.durationEstimate));
        }),
        onfinish : function() {
          $("body").removeClass("playing");
          currentPlaylist.next();        
        },
        onload : function () {
          $loading.css('width',"100%");
        }
      });

      if(audio) {
        audio.stop();
      }
      audio = null;
      audio = audioTracks[id]; // set current audio to the audio in the audioTracks hash
      if(audio.loaded) {
        $loading.css('width',"100%");
      }

      audio.setVolume(volume); // set vol again in case vol changed and going back to same track again

      if(track.artwork_url && !track.artwork_url.match(/default/)) {
        loadArtwork(track);
      } else {
        hideArtworkPane();
      }

      $(document).trigger("onPlay");

      $("#progress img").fadeOut("slow",function() {
        $("#progress img").attr("src",track.waveform_url);
        $("#progress img").load(function() {
          $("#progress img").fadeIn("slow");
        });
      });

    })
    .bind("onPlay",function() { // start the player
      if(audio) {
        if(audio.paused) {
          audio.resume();
        } else {
          audio.play();
        }
        $("body").addClass("playing");
      }
    })
    .bind("onStop",function() { // stop the player
      if(audio) {
        audio.pause();      
        $("body").removeClass("playing");
      }
    })
    .bind("onTogglePlay",function() { // toggle play/stop
      if($("body").hasClass("playing")) {
        $(document).trigger("onStop");
      }
      else {
        $(document).trigger("onPlay");
      }
    })
    .bind("onPlaylistSwitch",function(e,pl) { // change order of a playlist
      console.log('switched playlist');
      
      $("#lists > div").hide();
      $("#lists > div[listid="+pl.identifier+"]").show();
      $("#playlists li").removeClass("active");
      $("#playlists li[listid="+pl.identifier+"]").addClass("active");
      selectedPlaylist = pl;
      
    })
    .bind("onTrackAdd",function(e,track, pl, save) {

      pl.tracks.push(track);

      var list = $("#lists > div[listid="+pl.identifier+"] tbody");
      // sanitization for display
      track.description = (track.description ? track.description.replace(/(<([^>]+)>)/ig,"") : "");

      if (track.bpm == null) {
        track.bpm = "";
      }
      if (track.creator == null) {
        track.creator = "Unknown";
      }
      if (track.title == null) {
        track.title = "Untitled";
      }
      if (track.duration == null) {
        track.duration = 0;
      }
      if (track.provider_id == null) {
        track.provider_id = 0;
      }
      if(!track.genre) {
        track.genre = "";
      }
      //populate table
      $('#playlist-row table tr')
        .clone()
        .css("width",SC.arraySum(colWidths)+7*7)
        .find("td:nth-child(1)").css("width",colWidths[0]).end()
        .find("td:nth-child(2)").css("width",colWidths[1]).text(track.title).end()
        .find("td:nth-child(3)").css("width",colWidths[2]).html(track.creator).end()
        .find("td:nth-child(4)").css("width",colWidths[3]).text(SC.formatMs(track.duration)).end()
        .find("td:nth-child(5)").css("width",colWidths[4]).html("<img src='" + (TCP_GLOBALS.providers[track.provider_id+""] ? TCP_GLOBALS.providers[track.provider_id+""].icon_src : "") + "' />").end()
        .find("td:nth-child(6)").css("width",colWidths[5]).text(track.bpm).end()
        .find("td:nth-child(7)").css("width",colWidths[6]).html("<a href='#" + track.genre.replace(/\s/, "+") + "'>" + track.genre + "</a>")
        .end()
        .appendTo(list);
      $("tr:last",list).data("track",track);

      if(save) {
        savePlaylist(pl);        
      }

    })
    .bind("onTrackAddedToPlaylist",function(e,ui,pl) { // add tracks to a playlist
      console.log('adding tracks to a playlist',pl.identifier);

      justDropped = true;  // ugly, but I can't find a proper callback;

      if(ui.draggable.siblings(".selected").length > 0) { //multi-drag
        var items = ui.draggable.parents("tbody").find("tr.selected");
        $.each(items,function() {
          $(document).trigger("onTrackAdd",[$(this).data("track"),pl,true]);
        });
         flash(items.length + " tracks were added to the playlist");
      } else {
        $(document).trigger("onTrackAdd",[$(ui.draggable).data("track"),pl,true]);
        flash("The track " + $(ui.draggable).data("track").title + " was added to the playlist");           
      }

    });

  // init width from cookie
  var sidebarWidth = parseInt($.cookie('playlist_pane_width'));
  if(!sidebarWidth) {
    sidebarWidth = 220;
  }

  $("#sidebar").width(sidebarWidth);
  $("#main-container").css("left",sidebarWidth);
  $("#artwork").height(sidebarWidth);

  $("#sidebar")
    .mousemove(function(e) {
      if(withinPlaylistPaneDragArea(this,e)) {
        $(this).css("cursor","col-resize !important");
      } else {
        $(this).css("cursor","default");
      }
    })
    .mousedown(function(e) {
      var $pane = $(this);
      var $artwork = $("#artwork");
      var $cont = $("#main-container");
      var $playlists = $("#playlists");
      var $createPlaylists = $("#create-playlists");
      if(withinPlaylistPaneDragArea(this,e)) {
        $(document)
          .mouseup(function() {
            $(document).unbind("mousemove");
          })
          .mousemove(function(ev) {
            var colWidth = ev.clientX - ($pane.offset().left);
            $pane.width(colWidth);
            if(showingArtwork) {
              $playlists.css("bottom",colWidth+25);
              $createPlaylists.css("bottom",colWidth+0);
            }
            $artwork.height(colWidth);
            $cont.css("left",colWidth);
          });
      }
    })
    .mouseup(function() {
      $.cookie('playlist_pane_width',$(this).width());
    });

  // volume
  $("#volume").slider({
    value : volume,
    min : 0,
    max : 100,
    slide : function(e, ui) {
      if(audio) {
        volume = ui.value;
        audio.setVolume(volume);
      }
    },
    change : function(e, ui) {
      $.cookie('volume',ui.value); // save the volume in a cookie
    }
  });

  $('#next').click(function() {
    currentPlaylist.next();
  });

  $('#prev').click(function() {
    currentPlaylist.prev();
  });

  // artist info close btn
  $("#artist-info a.close").click(function(ev) {
    hideArtistPane();
    ev.preventDefault();
  });

  // artwork loading callback
  $("#artwork img, #artist-info img").load(function() {
    $(this).addClass("loaded");
  });

  $("#progress").click(function(ev) {
    var percent = (ev.clientX-$("#progress").offset().left)/($("#progress").width());
    if(audio.durationEstimate*percent < audio.duration) {
      audio.setPosition(audio.durationEstimate*percent);        
    }
  });

  $("#q")
    .focus(function() {
      this.focused = true;
      $(this).val('');
      $(window).click(function(ev) {
        // if(ev.target != self) {
        //   $("#q").blur();
        //   $(window).unbind("click");
        // }
      });
    })
    .blur(function() {
      this.focused = false;
      $(this).val('Search Artists & Tracks');
    })
    .keydown(function(ev) {
      if(ev.keyCode === 13) {
        removePlaylist("search1");
        var q = $("#q").val();

        playlists["search1"] = new SC.Playlist({
          is_owner: true,
          playlist: {
            id : "search1",
            name : "Search for '" + q + "'",
            version : 0,
            dontPersist : true,
            search : true,
            smart : true,
            smart_filter : {
              search_term : q,
              order: "hotness",
              hotness_from : "2007-01-01"
            }
          }
        });
        switchPlaylist("search1");
      } else if (ev.keyCode === 27) {
        $("#q").blur();
      }
    });

  // add playlist button
  $("#add-playlist").click(function(ev) {
    if($("body").hasClass("logged-in")) {
      var pos = $("#playlists li:not(.dont-persist)").index($("#playlists li:not(.dont-persist):last"))+1; //FIXME respect non-persisted playlists, and first
      $.post("/playlists",{'title':"Untitled playlist",'position': pos},function(playlist) {
        initPlaylist(playlist);
        $(document).trigger("onPlaylistSwitch", playlist);
        //$("#playlists li:last a:first").click();
      },"json");
      ev.preventDefault();
    }
  });

  // smart playlists button
  $("#add-smart-playlist").click(function(ev) {
    if($("body").hasClass("logged-in")) {
      $("#lists").animate({top:135});
      $("#artist-info").animate({height:"hide"});
      $("#create-smart-playlist").animate({height:"show"},function() {
        setTimeout(function() { // ui.slider bug so have to delay execution here 1ms
          $("#pl-bpm-range-slider").slider("moveTo",250,1);
          $("#pl-bpm-range-slider").slider("moveTo",0,0);
        },10);
        $("#pl-genre,#pl-artist,#pl-favorite,#pl-search-term").val("")
        $("#pl-genre").focus();
      });
      ev.preventDefault();
    }
  });

  // add xspf playlist button
  $("#add-xspf-playlist").click(function(ev) {
    $("#add-xspf-playlist > div:first")
      .clone()
      .find("a.close").click(function() {
        $(this).parents("div.add-xspf-playlist").fadeOut(function() {
          $(this).remove();
        });
        return false;
      }).end()
      .find("input:first").val("").end()
      .find("input:last").click(function() {
        $.post("/playlists",{location:$(this).parents("div.add-xspf-playlist").find("input:first").val()},function(data) {
          initPlaylist(data);
          $(document).trigger("onPlaylistSwitch",data);
        },"json");

        $(this).parents("div.add-xspf-playlist").fadeOut(function() {
          $(this).remove();
        });

        return false;
      }).end()
      .appendTo("body")
      .fadeIn(function() {
        $(".add-xspf-playlist input").focus().select();
      });
    ev.preventDefault();
  });

  // main keyboard listener
  $(window).keydown(function(ev) {
    if(!$("#q")[0].focused && !window.editingText) { // don't listen to key events if search field is focused or if editing text
      if(ev.keyCode === 8) { // delete selected tracks
        var $list = $("div[listid=" + selectedPlaylist.identifier + "]");
        if($("tr.selected",$list).length > 0) {
//          if(selectedPlaylist.editable) {
            var $selListItem = $("tr.selected:first",$list).prev("tr"); // select prev track when removing
            $("tr.selected",$list).remove();
            if($selListItem.length > 0) { // select track post-delete behaviour
              $selListItem.addClass("selected");
            } else {
              $("tr:first",$list).addClass("selected");
            }
            
            console.log('before',selectedPlaylist.tracks)

            // update tracks model
            selectedPlaylist.tracks = $.map($list.find("tr:not(.droppable-placeholder)"), function(el, index){
              return $(el).data("track");
            });
            
            console.log('after',selectedPlaylist.tracks)
            
            savePlaylist(selectedPlaylist);
//          }
          return false;
        }
      } else if(ev.keyCode === 32) { // start/stop play
        $(document).trigger("onTogglePlay");
      } else if (ev.keyCode === 13 && !smartPlaylistFormFocus) { // start selected track, don't trigger if focus on smart playlist create form
        if($("tr.selected",selectedPlaylist.list).length > 0) {
          var idx = $("tr", selectedPlaylist.list).index($("tr.selected",selectedPlaylist.list));            
          selectedPlaylist.loadTrack(idx);
        } else if ($("tr",selectedPlaylist.list).length > 0) {
          $("tr", selectedPlaylist.list).eq(0).addClass("selected");
          var idx = 0;
          selectedPlaylist.loadTrack(idx);
        }
      } else if (ev.keyCode === 40) { // arrow down, select next
        var sel = $("tr.selected:last",selectedPlaylist.list);
        if(sel.length > 0 && sel.next().length > 0) { // check so that el exists

          // a bit messy code that scrolls with the selected element
          if(sel.next().offset().top > (($("> div:last",selectedPlaylist.dom).height()+$("> div:last",selectedPlaylist.dom).offset().top) - 19) ) {
            $("> div:last",selectedPlaylist.dom)[0].scrollTop += 19;
          }

          if(ev.shiftKey) { // select next track
            $("tr.selected",selectedPlaylist.list).next().addClass("selected");
          } else {
            $("tr", selectedPlaylist.list).removeClass("selected");
            sel.next().addClass("selected");
          }
        }
        return false;
      } else if (ev.keyCode === 38) { // arrow up, select prev
        var sel = $("tr.selected:first",selectedPlaylist.list);
        if(sel.length > 0 && sel.prev().length > 0) { // check so that el exists

          // a bit messy code that scrolls with the selected element
          if(sel.prev().offset().top < ($("> div:last",selectedPlaylist.dom).offset().top) ) {
            $("> div:last",selectedPlaylist.dom)[0].scrollTop -= 19;
          }

          if(ev.shiftKey) { // select prev track
            $("tr.selected",selectedPlaylist.list).prev().addClass("selected");
          } else {
            $("tr", selectedPlaylist.list).removeClass("selected");
            sel.prev().addClass("selected");
          }
        }
        return false;
      } else if (ev.keyCode === 39 && $("body").hasClass("playing")) { // arrow next, play next if playing
        selectedPlaylist.next();
      } else if (ev.keyCode === 37 && $("body").hasClass("playing")) { // arrow prev, play prev if playing
        selectedPlaylist.prev();
      } else if (ev.keyCode === 70 && ev.metaKey) { // cmd-f for search
        $("#q").focus();
        return false;
      } else if (ev.keyCode === 65 && ev.metaKey) { // cmd-a for select all
        $("tr",selectedPlaylist.list).addClass("selected");
        return false;
      }
    } else {
      if (ev.keyCode === 70 && ev.metaKey) { // cancel normal browser behaviour for cmd-f
        return false;
      }
    }
  });

  // click behaviour for transport buttons
  $("#play,#prev,#next,#rand,#loop,#add-playlist,#add-smart-playlist,#add-xspf-playlist").mousedown(function() {
    $(this).addClass("click");
  }).mouseup(function() {
    $(this).removeClass("click");
  });

  function initPlaylist(pl) { // add the tab for the playlist

    playlists[pl.identifier + ""] = pl;

    var limit = 40, // limit of ajax requests
        offset = 0, // the offset when getting more tracks through the rest interface
        endOfList = false, // this is false until server returns less than 100 hits
        loading = false, // cheap mans queueing
        currentPos = 0; // this is the current position in the list at which a track is playing, needed for continous play through playlists
    pl.persisted = (pl.dontPersist ? false : true);

    //pl.editable = (!pl.smart && (self.properties.playlist.collaborative || (self.properties.is_owner && !self.properties.playlist.collaborative)));

    // tmp hack
    var editable = true;

    $('#playlist')
      .clone()
      .attr('id','')
      .attr('listid',pl.identifier)
      .appendTo("#lists")
      .hide();

    var dom = $("#lists > div:last"); // a bit ugly

    var list = $("tbody", dom);

    // Playlist item events
    $("div[listid=" + pl.identifier + "] tr")
      .live("dblclick", function(e) {
  //        currentPlaylist = self;
          // find out at which position we are at in the playlist, and store that as the currentPos
  //        pl.currentPos = $(this).parents("tbody").find("tr").index(this);
        loadTrack($(e.target).parents("tr"));
      })
      .live("click",function(e) {
        // hopefully tmp code to workaround event issues
        var data = {};
        if(e.shiftKey) {
          data.shiftKey = e.shiftKey;
        } else if (e.metaKey) {
          data.metaKey = e.metaKey;
        }
        $(this).trigger("onPlaylistSelectionChange",data);
      });

    // load colWidths from cookies
    $.each(colWidths,function(i) {
      var c = parseInt($.cookie('playlist_col_width_' + i));
      if(c) {
        colWidths[i] = c;
      }
    });

    // header colWidths
    $("table.list-header th",dom).each(function(i) {
      $(this).width(colWidths[i]);
    });

    // header width
    $("table.list-header tr",dom).width(SC.arraySum(colWidths)+7*7);

    function withinHeaderDragArea(el,e) {
      var left = e.clientX-$(el).offset().left-($(el).width()+3);
      if(left > 0 && left < 4) {
        return true;
      } else {
        return false;
      }
    }

    $("table.list-header th",dom)
      .mousemove(function(e) {
        if(withinHeaderDragArea(this,e)) {
          $(this).css("cursor","col-resize");
        } else {
          $(this).css("cursor","default");
        }
      })
      .mousedown(function(e) {
        var $col = $(this);
        var oldColWidth = $col.width();
        var colIdx = $(this).parents("thead").find("th").index(this) + 1;
        var rowWidth = $(this).parents("tr").width();
        var $row = $(this).parents("tr");
        var $rows = $("tr",list);

        if(withinHeaderDragArea(this,e)) {
          $(document)
            .mouseup(function() {
              $(document).unbind("mousemove");
            })
            .mousemove(function(ev) {
              var colWidth = ev.clientX - $col.offset().left;
              $col.width(colWidth);
              // resize all the cells in the same col
              $("td:nth-child(" + colIdx + ")", list).width(colWidth);
              $row.width(rowWidth+(colWidth-oldColWidth));
              $rows.width(rowWidth+(colWidth-oldColWidth));
            });
        }
      })
      .mouseup(function(e) {
        var colIdx = $(this).parents("thead").find("th").index(this) + 1;
        $.cookie('playlist_col_width_' + (colIdx-1),$(this).width());
      });

      function savePosition(pl) {
        // find out position index, ignore non-persisted playlists
        var pos = $("#playlists li:not(.dont-persist)").index($("#playlists li:not(.dont-persist)[listid=" + pl.identifier + "]"));
        $.post("/playlists/" + pl.identifier ,{"_method":"PUT","position":pos},function(d,status) {
          if(status != "success") {
            flash("Sorry, saving the playlist position failed");
          }
        });
      }

      // delete the playlist
      function destroy() {
        $.post(pl.location,{"_method":"DELETE"},function(d,status) {
          if(status != "success") {
            flash("Sorry, deleting the playlist failed");
          }
        });

        // select first playlist after delete, if exists
        if($("#playlists li:first").length > 0) {
          $(document).trigger("onPlaylistSwitch",playlists[$("#playlists li:first").attr("listid")]);
        }

        $("#playlists li[listid=" + pl.identifier + "]").fadeOut('fast');
        $("#lists li[listid=" + pl.identifier + "]").remove();
        delete playlists[pl.identifier];

      }

      function length(pl) {
        return $("tr",list).length;
      }

      function next(pl) {
        $("tr",list).removeClass("playing");
        if(randomPlaylist) { // random is on
          pl.currentPos = Math.floor(Math.random()*$("tr",list).length); // refine random function later
          loadTrack(pl.currentPos);
        } else {
          var nxt = $("tr:nth-child("+(pl.currentPos+2)+")",list);
          if(nxt.length > 0) {
            pl.currentPos++;
            loadTrack(pl.currentPos);
          } else if (loopPlaylist) { // if loop playlist, then jump back to first track when reached end
            pl.currentPos = 0;
            loadTrack(pl.currentPos);
          }
        }
      }

      function prev(pl) {
        if (audio.position < 2000) {
          var prev = $("tr:nth-child("+(pl.currentPos)+")",list);
          if(prev.length > 0) {
            $("tr",list).removeClass("playing");
            pl.currentPos--;
            loadTrack(pl.currentPos);
          }
        }
        else {
          audio.setPosition(0);
        }
      }

      function loadTrack(tr) {
        $("tr",list).removeClass("playing");
//        var tr = $("tr",list).eq(pos);
        tr.addClass("playing selected");
        //pl.currentPos = pos;

        $(document).trigger("onLoadTrack",tr.data("track"));

      }

      // function addTrack(track) {
      // 
      // 
      //   // sanitization for display
      //   track.description = (track.description ? track.description.replace(/(<([^>]+)>)/ig,"") : "");
      // 
      //   if (track.bpm == null) {
      //     track.bpm = "";
      //   }
      //   if (track.creator == null) {
      //     track.creator = "Unknown";
      //   }
      //   if (track.title == null) {
      //     track.title = "Untitled";
      //   }
      //   if (track.duration == null) {
      //     track.duration = 0;
      //   }
      //   if (track.provider_id == null) {
      //     track.provider_id = 0;
      //   }
      //   if(!track.genre) {
      //     track.genre = "";
      //   }
      //   //populate table
      //   $('#playlist-row table tr')
      //     .clone()
      //     .css("width",SC.arraySum(colWidths)+7*7)
      //     .find("td:nth-child(1)").css("width",colWidths[0]).end()
      //     .find("td:nth-child(2)").css("width",colWidths[1]).text(track.title).end()
      //     .find("td:nth-child(3)").css("width",colWidths[2]).html(track.creator).end()
      //     .find("td:nth-child(4)").css("width",colWidths[3]).text(SC.formatMs(track.duration)).end()
      //     .find("td:nth-child(5)").css("width",colWidths[4]).html("<img src='" + (TCP_GLOBALS.providers[track.provider_id+""] ? TCP_GLOBALS.providers[track.provider_id+""].icon_src : "") + "' />").end()
      //     .find("td:nth-child(6)").css("width",colWidths[5]).text(track.bpm).end()
      //     .find("td:nth-child(7)").css("width",colWidths[6]).html("<a href='#" + track.genre.replace(/\s/, "+") + "'>" + track.genre + "</a>")
      //     .end()
      //     .appendTo(list);
      //   $("tr:last",list).data("track",track);
      // }

      // load the playlist data
      function loadPlaylistData() {
        if(!endOfList && !loading) {
          $("<div><div style='position:relative'><div class='throbber'></div></div></div>").appendTo(list);

          loading = true;
          // get the tracks from the backend

          if(pl.location.indexOf("?")>=0){
            var location = pl.location + "&offset=" + offset;
          }else{
            var location = pl.location + "?offset=" + offset;  
          }

          $.getJSON(location, function(data) {

            // done loading, so remove throbber
            $("> div:last",list).remove();

            offset += limit;
            if(data.tracks.length < limit) {
              endOfList = true;
            }
            
            if(editable) {
              $(list).sortable({
                appendTo: "#track-drag-holder",
                placeholder : "droppable-placeholder",
                tolerance : "pointer",
                _noFinalSort : true, // mod to support multi-sortable
                helper : function(e,el) {
                  if(!el.hasClass("selected")) { // imitate itunes selection behavior, avoid sortable bug
                    el.addClass("selected");
                    el.siblings("tr.selected").removeClass("selected");
                  }
                  if(el.siblings(".selected").length > 0) { // dragging more than one track
                    var els = el.parents("tbody").find(".selected").clone();
                    return $("<div></div>").prepend(els); // wrap all selected elements in a div
                  } else {
                    return el.clone(); // ghosted drag helper              
                  }
                },
                opacity: 0.7,
                delay: 30,
                start : function(e,ui) {
                  ui.item.css("display","block"); //prevent dragged element from getting hidden
                },
                beforeStop : function(e,ui) {
                  $(ui.placeholder).trigger("onPlaylistOrderChange",[ui, pl]);
                },
                stop : function(e,ui) {
                }
              });
            } else {
              console.log('readonly');
              // for read-only playlists, FIXME: make more DRY by moving default options to separate hash
              $(list).sortable({
                appendTo: "#track-drag-holder",
                placeholder : "droppable-placeholder-invisible",
                tolerance : "pointer",
                _noFinalSort : true, // mod to support multi-sortable
                helper : function(e,el) {
                  if(!el.hasClass("selected")) { // imitate itunes selection behavior, avoid sortable bug
                    el.addClass("selected");
                    el.siblings("tr.selected").removeClass("selected");
                  }
                  if(el.siblings(".selected").length > 0) { // dragging more than one track
                    var els = el.parents("tbody").find(".selected").clone();
                    return $("<div></div>").prepend(els); // wrap all selected elements in a div
                  } else {
                    return el.clone(); // ghosted drag helper              
                  }
                },
                sort : function(e,ui) {
                  //ui.placeholder.remove();
                },
                opacity: 0.7,
                delay: 30,
                start : function(e,ui) {
                  ui.item.css("display","block"); //prevent dragged element from getting hidden
                }
              });
            };
            
            $.each(data.tracks,function() {
              // probably check here if the track already exists in the local tracks hash
              tracks[this.identifier] = this;

              // add the track to the playlist
              $(document).trigger("onTrackAdd",[tracks[this.identifier],pl]);

            });

            //show new tracks with fade fx
            loading = false;

          });
        }
      }

    loadPlaylistData();

    $("> div",dom).scroll(function() {
      // start pre-loading more if reaching nearer than 400px to the bottom of list 
      if(this.scrollHeight-(this.scrollTop+this.clientHeight) < 400) {
        loadPlaylistData();
      }
    });

    // ugly, tmp, set to not break
    pl.is_owner = true;

    $("<li listid='" + pl.identifier + "' class='" + (pl.is_owner ? "" : "shared") + " " + (pl.collaborative ? "collaborative" : "") + " " + (pl.persisted ? "" : "dont-persist") + " " + (pl.smart ? "smart" : "") + " " + (pl.search ? "search" : "") + "'><span></span><a href='#" + pl.title.replace(/\s/, "+") + "'>" + pl.title + (pl.is_owner ? "" : " <em>by " + pl.title + "</em>") + "</a><a class='collaborative' title='Make Playlist Collaborative' href='/playlists/" + pl.identifier + "'>&nbsp;</a><a class='share' title='Share Playlist' href='/share/" + pl.title + "'>&nbsp;</a><a class='delete' title='Remove Playlist' href='/playlists/" + pl.identifier + "'>&nbsp;</a></li>")
      .find('a.delete').click(function() {
        if(confirm("Do you want to delete this playlist?")) {
          destroy();
        }        
        return false;
      }).end()
      .find('a.share').click(function() {
        if($("body").hasClass("logged-in")) {
          $("#share-playlist > div:first")
            .clone()
            .find("a.close").click(function() {
              $(this).parents("div.share-playlist").fadeOut(function() {
                $(this).remove();
              });
              return false;
            }).end()
            .find("input").val(this.href).end()
            .appendTo("body")
            .fadeIn(function() {
              $(".share-playlist input").focus().select();
            });
        }
        return false;
      }).end()
      .find('a.collaborative').click(function() {
        if(!$(this).parents("li").hasClass("shared")) {
          $.post("/playlists/" + pl.identifier ,{"_method":"PUT","collaborative":!pl.collaborative,"version":pl.version},function() {
            pl.collaborative = !pl.collaborative;
            $("#playlists li[listid=" + pl.identifier + "]").toggleClass("collaborative");
            if(pl.collaborative) {
              flash("This playlist is now collaborative and can be edited by others");
            } else {
              flash("This playlist is not collaborative anymore and cannot be edited by others");
            }
          });
        }
        return false;
      }).end()
      .appendTo("#playlists");

    if(editable) { // if playlists are smart, they are read-only
      $('#playlists li:last')
        .droppable({
          accept: function(draggable) {
            return $(draggable).is('tr');
          },
          activeClass: 'droppable-active',
          hoverClass: 'droppable-hover',
          tolerance: 'pointer',
          drop: function(ev, ui) {
            $(document).trigger("onTrackAddedToPlaylist",[ui, pl]);
          }
        });
    }
  }
  
  // save a playlist title
  function savePlaylistTitle(pl) {
    pl.title = pl.title.replace(/<.*?>/,""); // sanitize name
    $.post(pl.location ,{"_method":"PUT","title":pl.title},function(d,status) {
      if(status == "success") {
        pl.version++;
      } else {
        flash("Sorry, saving the playlist failed");
      }
    });    
  }
  
  // save the playlist tracks order
  function savePlaylist(pl) {
    console.log(pl.tracks)
    $.ajax({
      url : pl.location,
      //contentType: "application/json",
      dataType : "json",
      type : "PUT",
      data : {"tracks":JSON.stringify(pl.tracks)}
    });
  }
  
  // clicking on a playlist in the list of playlists
  $("#playlists li").live("click",function(e) {
    var pl = playlists[$(e.target).parents("li").attr("listid")];
    if($(e.target).parents("li").hasClass("active") && pl.is_owner && $("body").hasClass("logged-in")) {
      var that = e.target; // very strange that i can't use self here
      if(!window.editingText) { // edit in place for playlist title
        setTimeout(function() {
          var origValue = $(that).text();
          window.editingText = true;
          $(that).html("<input type='text'>");
          $("input",that).val(origValue);
          $("input", that).focus();
          $("input", that).select();
  
          // closes editInPlace and saves if save param is true
          var closeEdit = function(save) {
            if(save) {
              pl.title = $("input",that).val().replace(/<.*?>/,"");
              $(that).text(pl.title).attr("href", "#" + pl.title.replace(/\s/, "+"));;
              savePlaylistTitle(pl);
            } else {
              $(that).text(origValue);
            }
            window.editingText = false;
            e.stopPropagation();
            $(document).unbind("click",applyEditClick);
            $(window).unbind("keydown",editKey);                
          }
  
          var applyEditClick = function(e) {
            if(!(e.target == $("input",that)[0])) { // save if click anywhere but on the editing input
              closeEdit(true);
            }
          };
  
          $(document).bind("click", applyEditClick);
  
          var editKey = function(e) {
            if(e.keyCode === 27) {
              closeEdit();
              return false;
            } else if (e.keyCode === 13) { // start selected track
              closeEdit(true);
              return false;
            }
          }
  
          $(window).keydown(editKey);
  
        },500);
      }
    } else {
      $(document).trigger("onPlaylistSwitch",pl);
    }
    return false;
  });

  // if logged in, load users playlists
  if($("body").hasClass("logged-in")) {

    // load playlists for user
    $.getJSON("/playlists",function(d) {
      $.each(d.playlists,function() {
        this.tracks = [];
        initPlaylist(this);
      });

      // show flash message if received a shared playlist
      if(location.search.search(/add_shared_playlist/) != -1) {
        $(document).trigger("onPlaylistSwitch",playlists[$("#playlists li:last").attr("listId")]); // select shared playlist
        flash("The playlist has been added to your library");
      } else if (location.search.search(/playlist_not_found/) != -1) {
        flash("The playlist was not found");
      } else if (location.search.search(/playlist_already_in_lib/) != -1) {
        flash("You already have this playlist");
      } else {
        if(d.playlists.length > 0) { // switch to first playlist
          $(document).trigger("onPlaylistSwitch",d.playlists[0]);
        }
      }

    });

    // providers dialog
    $("#providers").click(function() {
      $("#providers-box").fadeIn();
      return false;
    });

  } else { // not logged in, then load a few standard playlists without persisting

    // load playlists for user
    $.getJSON("/playlists",function(d) {
      $.each(d.playlists,function() {
        // do something useful here
      });
    });

    var options = {
      'request_token_endpoint': '/soundcloud-connect/request_token',
      'access_token_endpoint': '/soundcloud-connect/access_token',
      'callback': function(query_obj){ 
          $('.current-user-name').html(query_obj.username);
          $('body').removeClass('logged-out').addClass('logged-in');            

          // remove default playlists
          $("#playlists li").remove();
          $("#lists li").remove();

          // load playlists for user
          $.getJSON("/playlists",function(d) {
            $.each(d.playlists,function() {
              initPlaylist(this);
            });
            if(d.playlists.length > 0) { // switch to first playlist
              $(document).trigger("onPlaylistSwitch",d.playlists[0]);
            }          
          });

        }
    };

    $('.connect-to-soundcloud').each(function(button){
      //SC.Connect.prepareButton(this,options); 
      $(button).click(function(){
        var openid_url = prompt('Your OpenID identity URL:');
        if(openid_url && openid_url != ""){
          $('input#openid_url').val(openid_url).parent().submit();
        }        
      });
    });

  }

  $("#playlists").sortable({
    placeholder : "droppable-placeholder",
    helper : function(e,el) {
      return el.clone(); // ghosted drag helper
    },
    opacity: 0.7,
    delay: 30,
    start : function(e,ui) {
      ui.item.css("display","block"); //prevent dragged element from getting hidden
    },
    stop : function(e,ui) {
      if(!ui.item.hasClass("dont-persist")) { // save if playlist is persisted
        playlists[ui.item.attr('listid')].savePosition();          
      }
    }
  });

  function flash(message) {
    $("#flash").find("div").text(message).end().fadeIn();
    setTimeout(function(){$("#flash").fadeOut();},1500);
  }
  
  function loadArtwork(track) {
    $("#artwork img")
      .removeClass("loaded")
      .attr("src",track.artwork_url)
      .attr("title",track.description);
    showArtworkPane();
  }
  
  function showArtworkPane() {
    $("#playlists").animate({bottom:$("#artwork").width()+25});
    $("#create-playlists").animate({bottom:$("#artwork").width()});
    $("#artwork").animate({height:"show"});
    showingArtwork = true;
  }
  
  function hideArtworkPane() {
    $("#playlists").animate({bottom:25});
    $("#create-playlists").animate({bottom:0});
    $("#artwork").animate({height: 'hide'});
    showingArtwork = false;
  }
    
  function removePlaylist(id) {
    if($("#playlists li[listid="+id+"]").length > 0) {
      playlists[id] = null;
      $("#lists #list-"+id).remove();
      $("#playlists li[listid="+id+"]").remove();      
    } else if (playlists[id]) { // for hidden playlists, like artist/genre playlists
      playlists[id] = null;
      $("#lists #list-"+id).remove();      
    }
  }
  
});

soundManager.flashVersion = 9;
soundManager.url = '/scripts/.';
soundManager.useConsole = true;
soundManager.consoleOnly = true;
soundManager.debugMode = false; // disable debug mode
soundManager.defaultOptions.multiShot = false;
soundManager.useHighPerformance = false;
soundManager.useMovieStar = true;

soundManager.onload = function() {
  // soundManager is ready to use (create sounds and so on)
  // init the player app
}
