class Playlist < ActiveRecord::Base
  STATIC_GUEST_PLAYLISTS = [1]
  ALLOWED_ATTRIBUTES = [:title]
  ALL_ATTRIBUTES = [:title, :provider_id, :read_only]

  has_many :listings, :order => "listings.position", :dependent => :destroy
  has_many   :tracks,   :order => "listings.position", :through => :listings, :source => :track

  include ActionController::UrlWriter
  
  before_create :refresh, :if => :remote?
  after_create  :refresh_tracks, :if => :remote? 
  #belongs_to :access_token
  
  belongs_to :provider
  
  has_many :playlist_listings, :dependent => :destroy
  has_many :users, :through => :playlist_listings, :source => :user
  
  # belongs_to :owner
  
  def self.static_guest_playlists
    playlists = []
    playlists = Playlist.find(STATIC_GUEST_PLAYLISTS)
    return playlists
  rescue ActiveRecord::RecordNotFound
    return playlists
  end
  
  def read_only 
    false
  end
  
  def refresh
    p "Refreshing #{location}"
    playlist = Hash.from_xml(xspf)['playlist']
    uri = URI.parse(location)
    
    self.provider = Provider.from_host(uri.host)
    
    self.title = playlist['title'].blank? ? uri.host : playlist['title']
    self.location = playlist['location']
    self.identifier = playlist['location']
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
      location = playlist_view_path(self)
    else
      read_attribute(:location)
    end
  end
  
  def title
    read_attribute(:title).to_s
  end
    
  def to_jspf
    playlist = {}
    ALL_ATTRIBUTES.each do |k|
      playlist[k] = self.send(k)
    end
    playlist[:read_only] = true
    playlist['identifier'] = id
    playlist['location'] = remote? ? playlist_view_path(self) : location
    
    playlist['tracks'] = []
    
    tracks.each do |track|
      playlist['tracks'] << track.to_jspf
    end
    
    playlist
  end

  def to_xspf
    
  end
  
end
