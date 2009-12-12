require 'soundcloud'

class AccessToken < ActiveRecord::Base
  belongs_to :provider
  belongs_to :user
  
  after_create :get_xspf_playlists
  
  def get_xspf_playlists
    Hash.from_xml(get('/xspf/index').body)['playlistList']['playlist'].each do |playlist_hash|      
      playlist = Playlist.find_or_create_by_location(:location => playlist_hash['location'])
      playlist_listing = PlaylistListing.find_or_create_by_user_id_and_playlist_id(:user_id => user.id, :playlist_id => playlist.id)
    end
  end
  
  def self.from_access_token(access_token)
    soundcloud_client = Soundcloud.register({:access_token => access_token, :site => $settings[:soundcloud_consumer][:site]})
    soundcloud_user = soundcloud_client.User.find_me
    
    at = find_or_create_by_remote_user_id(:remote_user_id       => soundcloud_user.id)
    at.provider_id  = 1
    at.access_token_id = at.id
    at.username     = soundcloud_user.username
    at.key          = access_token.token
    at.secret       = access_token.secret
    
    at.save!
    at
  end
  
  # delegate shit to real_access_token
  def method_missing(method, *args)
    super(method, *args)
  rescue NoMethodError
    real_access_token.send(method, *args)
  end

  # the real thing
  def real_access_token
    OAuth::AccessToken.new($soundcloud_consumer, key, secret)
  end
  
  #TODO srsly?
  def client
    return @client if @client
    @client = Soundcloud.register({:access_token => access_token, :site => $settings[:soundcloud_consumer][:site]})
   end 
end
