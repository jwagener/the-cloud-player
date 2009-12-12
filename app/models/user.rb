class User < ActiveRecord::Base
  has_many :access_tokens
  #has_many :playlists
  
  has_many :playlist_listings, :dependent => :destroy
  has_many :playlists, :through => :playlist_listings, :source => :playlist, :order => "playlist_listings.position"
  
  def self.from_access_token(access_token)
    soundcloud_client = Soundcloud.register({:access_token => access_token, :site => $settings[:soundcloud_consumer][:site]})
    soundcloud_user = soundcloud_client.User.find_me
    
    user = find_or_create_by_remote_user_id(:remote_user_id       => soundcloud_user.id)
    #at.provider_id  = 1
    #at.access_token_id = at.id
    user.username     = soundcloud_user.username
    user.key          = access_token.token
    user.secret       = access_token.secret
    
    user.save!
    
    if user.access_tokens.length == 0
      user.access_tokens.create!(:key => access_token.token, :secret => access_token.secret, :provider_id => 1)
      #access_token.user = user
      #access_token.save!
    end
    
    user
  end
  
end