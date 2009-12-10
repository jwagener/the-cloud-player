class Playlist < ActiveRecord::Base
  ALLOWED_ATTRIBUTES = [:title]
  ALL_ATTRIBUTES = [:title, :location, :provider_id, :read_only]

  has_many :listings, :order => "listings.position", :dependent => :destroy
  has_many   :tracks,   :order => "listings.position", :through => :listings, :source => :track

  include ActionController::UrlWriter
  
  before_create :refresh, :if => :remote?
  after_create  :refresh_tracks, :if => :remote? 
  belongs_to :access_token
  
  def read_only 
    false
  end
  
  def refresh
    
    p "Refreshing #{location}"
    playlist = Hash.from_xml(xspf)['playlist']
    uri = URI.parse(location)
    
    #provider_id = Provider.find_or_create_by_host(:host => uri.host).id
    provider_id = Provider.from_host(uri.host).id
    
    title = playlist['title'].blank? ? uri.host : playlist['title']
    location = playlist['location']
    identifier = playlist['location']
  end
  
  def refresh_tracks
    playlist = Hash.from_xml(xspf)['playlist']
    unless playlist['trackList']['track'].nil?
      listings.destroy_all
      playlist['trackList']['track'].each_with_index do |track_hash, i|
        track = Track.from_hash(track_hash, provider_id)
        
        listings.create!(:track => track, :position => i)
      end
    end
  end
  
  def remote?
    !read_attribute(:location).blank?
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
    unless remote?
      location = playlist_view_path(self, :ignore => 'me')
    else
      read_attribute(:location)
    end
  end
  
  def title
    read_attribute(:title).to_s
  end
    
  def to_jspf
    unless remote?
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
