class OauthController < ApplicationController
  before_filter :login_required
  
  # OAuth related actions
  def request_token
    provider = Provider.find(params[:provider_param])
    
    request_token = provider.consumer.get_request_token(:oauth_callback => oauth_access_token_url(:provider_param => provider.to_param))
    session[:request_token_key] = request_token.token
    session[:request_token_secret] = request_token.secret    
    redirect_to "#{request_token.authorize_url}&display=popup"
  end

  def access_token
    provider = Provider.find(params[:provider_param])    
    request_token = OAuth::RequestToken.new(provider.consumer, session[:request_token_key], session[:request_token_secret])
    access_token = request_token.get_access_token(:oauth_verifier => params[:oauth_verifier])
    access_token = AccessToken.create!(:provider => provider, :user => current_user, :key => access_token.token, :secret => access_token.secret)
    
    @playlist = nil
    if session[:add_playlist_location]
      @playlist = Playlist.new(:location => session[:add_playlist_location], :user_id => current_user.id, :protected => true)
      @playlist.save!
      playlist_listing = PlaylistListing.find_or_create_by_user_id_and_playlist_id(:playlist_id => @playlist.id, :user_id => current_user.id)

      #render :json => playlist.to_jspf
    
    end
    
    render :layout => false
  end 
  
  
end
