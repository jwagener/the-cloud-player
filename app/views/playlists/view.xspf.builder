xml.instruct!
xml.playlist do
  xml.title       @playlist.title
  xml.creator     @playlist.creator
  xml.location    @playlist.location
  xml.identifier  @playlist.identifier
  
  xml.trackList do  
    @playlist.tracks.each do |track|
      xml.track do
        xml.title       track.title
        xml.creator     track.creator
        xml.location    track.location
        xml.identifier  track.identifier
        xml.duration    track.duration
      end
    end
  end
end
