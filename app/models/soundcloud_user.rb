require 'soundcloud'

class SoundcloudUser < ActiveRecord::Base
  def self.from_access_token(access_token)
    soundcloud_client = Soundcloud.register({:access_token => access_token, :site => $settings[:soundcloud_consumer][:site]})
    soundcloud_user = soundcloud_client.User.find_me
    
    user = find_or_create_by_soundcloud_id(:soundcloud_id        => soundcloud_user.id)
    user.username             = soundcloud_user.username
    user.access_token_key     = access_token.token
    user.access_token_secret  = access_token.secret
    
    user.save!
  end
  
  
  def access_token
    OAuth::AccessToken.new($soundcloud_consumer, access_token_key, access_token_secret)
    
  end
  
  def client
    return @client if @client
    @client = Soundcloud.register({:access_token => access_token, :site => $settings[:soundcloud_consumer][:site]})
   end 
end
