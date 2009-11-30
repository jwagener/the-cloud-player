class Playlist < ActiveRecord::Base
  include ActionController::UrlWriter
    
  belongs_to :access_token
  
  def get_xspf
    if access_token_id.nil?
      xspf = Net::HTTP.get(URI.parse(location))      
    else
      parsed_uri = URI.parse(location)
      relative_location = "#{parsed_uri.path}?#{parsed_uri.query}" 
      xspf = access_token.real_access_token.get(relative_location).body
    end    
    xspf
  end
  
  def to_jspf
    playlist = Hash.from_xml(get_xspf)['playlist']
    
    uri = URI.parse(location)
    playlist['title'] = uri.host if playlist['title'].blank?
    
    playlist['location'] = playlist_view_path(:location => location)
    playlist['provider_id'] = 1
    playlist['identifier'] = playlist['location']
    
    playlist['tracks'] = playlist['trackList']['track'].map do |track|
      track['provider_id'] = 1
      track['extensions'].each do |k, v|
        track[k] = v  
      end if track['extensions']
      track.delete('extensions') 
      track
    end
    playlist.delete('trackList')
    playlist
  end
end
