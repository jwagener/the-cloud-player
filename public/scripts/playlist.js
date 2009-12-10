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

// todo: better internal data structure for playlists, know position in list, remove track etc
SC.Playlist = SC.Class();
SC.Playlist.prototype = {
  initialize: function(props,player) {
    this.player = player; // ref to the player
    if (player.playlists[props.playlist.id]) { return; } // if it already exists, bail out here

    this.init(props); // init the playlist

    // add tab to list of playlists
    // but only do this if it's not simply an artist or genre playlist
    if(!this.properties.playlist.dontShowPlaylistItem) {
      this.addToPlaylistsList();      
    }

  },
  init : function(props) { // this will init the playlist
    this.properties = props;
    var self = this;
    this.limit = 40; // limit of ajax requests
    this.name = props.playlist.name;
    this.id = props.playlist.id;
    this.location = props.playlist.location;
    this.version = props.playlist.version;
    this.offset = 0; // the offset when getting more tracks through the rest interface
    this.endOfList = false; // this is false until server returns less than 100 hits
    this.loading = false; // cheap mans queueing
    this.currentPos = 0; // this is the current position in the list at which a track is playing, needed for continous play through playlists
    this.persisted = (props.playlist.dontPersist ? false : true);
    
    this.editable = (!self.properties.playlist.smart && (self.properties.playlist.collaborative || (self.properties.is_owner && !self.properties.playlist.collaborative)));
    
    $('#playlist')
      .clone()
      .attr('id',"list-" + props.playlist.id)
      .appendTo("#lists")
      .hide();
      
    this.dom = $("#lists > div:last"); // a bit ugly

    this.list = $("tbody", this.dom);

    this.colWidths = new Array(20,250,130,50,250,50,100); // default col widths
    
    // load colWidths from cookies
    $.each(this.colWidths,function(i) {
      var c = parseInt($.cookie('playlist_col_width_' + i));
      if(c) {
        self.colWidths[i] = c;
      }
    });
    
    // header colWidths
    $("table.list-header th",this.dom).each(function(i) {
      $(this).width(self.colWidths[i]);
    });

    // header width
    $("table.list-header tr",this.dom).width(SC.arraySum(self.colWidths)+7*7);
    
    function withinHeaderDragArea(el,e) {
      var left = e.clientX-$(el).offset().left-($(el).width()+3);
      if(left > 0 && left < 4) {
        return true;
      } else {
        return false;
      }
    }

    $("table.list-header th",this.dom)
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
        var $rows = $("tr",self.list);

        if(withinHeaderDragArea(this,e)) {
          $(document)
            .mouseup(function() {
              $(document).unbind("mousemove");
            })
            .mousemove(function(ev) {
              var colWidth = ev.clientX - $col.offset().left;
              $col.width(colWidth);
              // resize all the cells in the same col
              $("td:nth-child(" + colIdx + ")", self.list).width(colWidth);
              $row.width(rowWidth+(colWidth-oldColWidth));
              $rows.width(rowWidth+(colWidth-oldColWidth));
            });
        }
      })
      .mouseup(function(e) {
        var colIdx = $(this).parents("thead").find("th").index(this) + 1;
        $.cookie('playlist_col_width_' + (colIdx-1),$(this).width());
      });
    
    this.load();

    $("> div",this.dom).scroll(function() {
      // start pre-loading more if reaching nearer than 400px to the bottom of list 
      if(this.scrollHeight-(this.scrollTop+this.clientHeight) < 400) {
        self.load();
      }
    });    
  },
  reload : function(props) {
    // remove playlist
    this.dom.remove();
    this.init(props);
    this.player.switchPlaylist(this.id);
  },
  load : function() {
    var self = this;
    if(!this.endOfList && !this.loading) {
      $("<div><div style='position:relative'><div id='throbber'></div></div></div>").appendTo(self.list);
      self.loading = true;
      self.tracks = [];
      // get the tracks from the backend
      
      if(self.location.indexOf("?")>=0){
        var location = self.location + "&offset=" + this.offset;
      }else{
        var location = self.location + "?offset=" + this.offset;  
      }
      
      $.get(location, function(dataJS) {
        var data = eval("(" + dataJS + ")");
        self.processTrackData(data);
      });
    }
  },
  processTrackData : function(data) {
    var self = this;
    self.offset += this.limit;
    if(data.tracks.length < this.limit) {
      self.endOfList = true;
    }
    
    self.tracks = data.tracks;
    $("> div:last",self.list).remove();

    if(self.editable) {
      $(self.list).sortable({
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
          if(self.player.justDropped) { // disable sort behavior if dropping in another playlist. ugly, but I can't seem to find a proper callback;
            self.player.justDropped = false; // ugly, but I can't find a proper callback;
          } else {
            ui.placeholder.after(ui.item.parents("tbody").find("tr.selected")); // multi-select-hack, move all selected items to new location                            
          }
        },
        stop : function(e,ui) {
        }
      });
    } else {
      // for read-only playlists, FIXME: make more DRY by moving default options to separate hash
      $(self.list).sortable({
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

    $.each(self.tracks,function() {
      self.addTrack(this);
    });
    //show new tracks with fade fx
    self.loading = false;
    
  },
  save : function() {
    var self = this;
    
    console.log(self.tracks);
    
    
//    var tracks = "";
    // $("tr:not(.droppable-placeholder)",this.list).each(function() {
    //   tracks += this.track.id + ",";
    // });
    // if($("tr:not(.droppable-placeholder)",this.list).length == 0) {
    //   tracks = "0";
    // }
    
    // $.post("/playlists/" + this.id ,{"_method":"PUT","tracks":tracks,"version":this.version},function(dataJS) {
    //   var data = eval('(' + dataJS + ')');
    //   if(data.response == 200) {
    //     self.version++;
    //   } else {
    //     self.player.flash("Failed when saving playlist. Reloading.");
    //     self.reload(data); // reload the playlist based on data in json response
    //   }
    // });
  },
  saveName : function() {
    var self = this;
    this.name = this.name.replace(/<.*?>/,""); // sanitize name
    $.post(this.location ,{"_method":"PUT","title":this.name},function(dataJS) {
      var data = eval('(' + dataJS + ')');
      if(data.response == 200) {
        self.version++;
      } else {
        self.player.flash("Sorry, saving the playlist failed");
      }
    });    
  },
  savePosition : function() {
    var self = this;
    // find out position index, ignore non-persisted playlists
    var pos = $("#playlists li:not(.dont-persist)").index($("#playlists li:not(.dont-persist)[listid=" + this.id + "]"));
    $.post("/playlists/" + this.id ,{"_method":"PUT","position":pos},function(dataJS) {
      var data = eval('(' + dataJS + ')');
      if(data.response == 200) {
      } else {
        self.player.flash("Sorry, saving the playlist position failed");
      }
    });    
  },
  destroy : function() {
    if(this.persisted) {
      $.post(this.location,{"_method":"DELETE"},function() {
      });      
    }
    // select first playlist after delete, if exists
    if($("#playlists li:first").length > 0) {
      this.player.switchPlaylist($("#playlists li:first").attr("listid"));      
    }

    $("#playlists li[listid=" + this.id + "]").fadeOut('fast');
    $("#lists #list-"+this.id).remove();

  },
  length : function() {
    return $("tr",this.list).length;
  },
  next : function() {
    $("tr",this.list).removeClass("playing");
    if(this.player.randomPlaylist) { // random is on
      this.currentPos = Math.floor(Math.random()*$("tr",this.list).length); // refine random function later
      this.loadTrack(this.currentPos);
    } else {
      var nxt = $("tr:nth-child("+(this.currentPos+2)+")",this.list);
      if(nxt.length > 0) {
        this.currentPos++;
        this.loadTrack(this.currentPos);
      } else if (this.player.loopPlaylist) { // if loop playlist, then jump back to first track when reached end
        this.currentPos = 0;
        this.loadTrack(this.currentPos);
      }
    }
  },
  prev : function() {
    if (this.player.audio.position < 2000) {
      var prev = $("tr:nth-child("+(this.currentPos)+")",this.list);
      if(prev.length > 0) {
        $("tr",this.list).removeClass("playing");
        this.currentPos--;
        this.loadTrack(this.currentPos);
      }      
    }
    else {
      this.player.audio.setPosition(0);
    }
  },
  loadTrack : function(pos) {
    $("tr",this.list).removeClass("playing");
    var tr = $("tr",this.list).eq(pos);
    tr.addClass("playing");
    this.currentPos = pos;
    this.player.load(tr[0].track);
  },
  addTrack : function(track,single) {
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

    var self = this;
    
    if(!track.genre) {
      track.genre = "";
    }
    //populate table
    $('#playlist-row table tr')
      .clone()
      .css("width",SC.arraySum(self.colWidths)+7*7)
      .dblclick(function() {
        self.player.currentPlaylist = self;
        // find out at which position we are at in the playlist, and store that as the currentPos
        self.currentPos = $(this).parents("tbody").find("tr").index(this);
        $(this).addClass("selected");
        self.loadTrack(self.currentPos);
      })
      .click(function(e) {
        if(e.shiftKey) {
          if($(this).siblings(".selected").length > 0) {
            var list = self.list;
            var oldIdx = $("tr",list).index($(this).siblings(".selected")[0]);
            var newIdx = $("tr",list).index(this);
            var start = (oldIdx - newIdx < 0 ? oldIdx : newIdx);
            var stop = (oldIdx - newIdx < 0 ? newIdx : oldIdx);
            for(var i = start;i <= stop;i++) {
              $("tr",list).eq(i).addClass("selected");              
            }
          }
        } else if (e.metaKey) {
          $(this).toggleClass("selected");
        } else {
          $(this).siblings().removeClass("selected").end().toggleClass("selected");          
        }
      })
      .find("td:nth-child(1)").css("width",self.colWidths[0]).end()
      .find("td:nth-child(2)").css("width",self.colWidths[1]).text(track.title).end()
      .find("td:nth-child(3)").css("width",self.colWidths[2]).html(track.creator).end()
      .find("td:nth-child(4)").css("width",self.colWidths[3]).text(SC.formatMs(track.duration)).end()
      .find("td:nth-child(5)").css("width",self.colWidths[4]).html("<img src='" + (TCP_GLOBALS.providers[track.provider_id+""] ? TCP_GLOBALS.providers[track.provider_id+""].icon_src : "") + "' />").end()
      .find("td:nth-child(6)").css("width",self.colWidths[5]).text(track.bpm).end()
      .find("td:nth-child(7)").css("width",self.colWidths[6]).html("<a href='#" + track.genre.replace(/\s/, "+") + "'>" + track.genre + "</a>")
        .find("a")
        .history(function(ev) {
          var genre = this.innerHTML;
          self.player.removePlaylist("genre");
          self.player.playlists["genre"] = new SC.Playlist({
            is_owner: true,
            playlist : {
              id : "genre",
              smart: true,
              smart_filter: {
                genres : genre,
                order: "hotness"                
              },
              dontPersist : true,
              dontShowPlaylistItem : true
            }
          }, self.player);
          self.player.switchPlaylist("genre");
        }).end()
      .end()
      .appendTo(this.list);
    $("tr:last",this.list)[0].track = track;
  },
  addToPlaylistsList: function() { // add the tab for the playlist
    var self = this;

    // ugly, tmp, set to not break
    this.properties.is_owner = true;

    $("<li listId='" + this.id + "' class='" + (this.properties.is_owner ? "" : "shared") + " " + (this.properties.playlist.collaborative ? "collaborative" : "") + " " + (this.persisted ? "" : "dont-persist") + " " + (this.properties.playlist.smart ? "smart" : "") + " " + (this.properties.playlist.search ? "search" : "") + "'><span></span><a href='#" + this.name.replace(/\s/, "+") + "'>" + this.name + (this.properties.is_owner ? "" : " <em>by " + this.properties.playlist.owner.nickname + "</em>") + "</a><a class='collaborative' title='Make Playlist Collaborative' href='/playlists/" + this.id + "'>&nbsp;</a><a class='share' title='Share Playlist' href='/share/" + this.properties.playlist.share_hash + "'>&nbsp;</a><a class='delete' title='Remove Playlist' href='/playlists/" + this.id + "'>&nbsp;</a></li>")
      .find('a:first').click(function(ev) {
        if($(this).parents("li").hasClass("active") && self.properties.is_owner && $("body").hasClass("logged-in")) {
          var that = this; // very strange that i can't use self here
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
                  self.name = $("input",that).val().replace(/<.*?>/,"");
                  $(that).text(self.name).attr("href", "#" + self.name.replace(/\s/, "+"));;
                  self.saveName();
                } else {
                  $(that).text(origValue);                  
                }
                window.editingText = false;
                ev.stopPropagation();
                $(document).unbind("click",applyEditClick);
                $(window).unbind("keydown",editKey);                
              }

              var applyEditClick = function(ev) {
                if(!(ev.target == $("input",that)[0])) { // save if click anywhere but on the editing input
                  closeEdit(true);
                }
              };

              $(document).bind("click", applyEditClick);

              var editKey = function(ev) {
                if(ev.keyCode === 27) {
                  closeEdit();
                  return false;
                } else if (ev.keyCode === 13) { // start selected track
                  closeEdit(true);
                  return false;
                }
              }

              $(window).keydown(editKey);

            },500);
          }
        } else {
          self.player.switchPlaylist(self.id);
        }
        return false;
      })
      .attr('pane',this.dom)
      .end()
      .find('a.delete').click(function() {
        if(confirm("Do you want to delete this playlist?")) {
          self.destroy();
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
          $.post("/playlists/" + self.id ,{"_method":"PUT","collaborative":!self.properties.playlist.collaborative,"version":self.version},function() {
            self.properties.playlist.collaborative = !self.properties.playlist.collaborative;
            $("#playlists li[listid=" + self.id + "]").toggleClass("collaborative");
            if(self.properties.playlist.collaborative) {
              self.player.flash("This playlist is now collaborative and can be edited by others");
            } else {
              self.player.flash("This playlist is not collaborative anymore and cannot be edited by others");
            }
          });          
        }
        return false;
      }).end()
      .appendTo("#playlists");


        	
    // if(this.editable) { // if playlists are smart, they are read-only
    //       $('#playlists li:last')
    //        .droppable({
    //          accept: function(draggable) {
    //            return $(draggable).is('tr');
    //          },
    //          activeClass: 'droppable-active',
    //          hoverClass: 'droppable-hover',
    //          tolerance: 'pointer',
    //          drop: function(ev, ui) {
    //            self.player.justDropped = true;  // ugly, but I can't find a proper callback;
    //            var listId = $(this).attr('listId');
    //            if(ui.draggable.siblings(".selected").length > 0) { //multi-drag
    //              var items = ui.draggable.parents("tbody").find("tr.selected");
    //              $.each(items,function() {
    //                self.addTrack(this.track,true);
    //              });
    //               self.player.flash(items.length + " tracks were added to the playlist");
    //            } else {
    //              self.addTrack($(ui.draggable)[0].track,true);
    //               self.player.flash("The track " + $(ui.draggable)[0].track.title + " was added to the playlist");           
    //            }
    //             self.save();
    //          }
    //        });     
    // }
  		
                      }
}
