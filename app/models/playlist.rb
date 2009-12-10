class Playlist < ActiveRecord::Base
  ALLOWED_ATTRIBUTES = [:title]
  ALL_ATTRIBUTES = [:title, :location]

  has_many :listings, :order => "listings.position", :dependent => :destroy
  has_many   :tracks,   :order => "listings.position", :through => :listings, :source => :track

  include ActionController::UrlWriter
  before_create :set_title  
  belongs_to :access_token
  
  
  def set_title
    title = Hash.from_xml(xspf)['playlist']['title'] unless attributes[:location].blank?
  end
  
  def xspf
    return @xspf if @xspf
    if access_token_id.nil?
      @xspf = Net::HTTP.get(URI.parse(location))      
    else
      parsed_uri = URI.parse(location)
      relative_location = "#{parsed_uri.path}?#{parsed_uri.query}" 
      @xspf = access_token.real_access_token.get(relative_location).body
    end    
    
    @xspf
  end
 
  def to_param
    self.id || "temp"
  end

  def location
    if read_attribute(:location).blank?
      location = playlist_view_path(self, :ignore => 'me')
    else
      read_attribute(:location)
    end
  end
  
  def title
    read_attribute(:title).to_s
  end
  
  def to_jspf
    if read_attribute(:location).blank?
      playlist = {}
      ALL_ATTRIBUTES.each do |k|
        playlist[k] = self.send(k)
      end
      #playlist = self.
      playlist['identifier'] = id
      playlist['location'] = location
      playlist['tracks'] = []
      
      tracks.each do |track|
        playlist['tracks'] << track.to_jspf
      end
      
      playlist[:read_only] = false
      return playlist
    else
      
      
      playlist = Hash.from_xml(xspf)['playlist']
      uri = URI.parse(location)
      playlist['title'] = uri.host if playlist['title'].blank?
      playlist[:read_only] = true
      playlist['location'] = playlist_view_path(self)
      playlist['provider_id'] = 1
      playlist['identifier'] = playlist['location']
      playlist['tracks'] = playlist['trackList']['track'].map do |track|
        track['provider_id'] = 1
        track['extensions'].each do |k, v|
          track[k] = v  
        end if track['extensions']
        track.delete('extensions') 
        track
      end unless playlist['trackList']['track'].nil?
      playlist.delete('trackList')
      return playlist
    end
  end
end
