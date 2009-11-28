class PlaylistsController < ApplicationController
  def index
    if logged_in?
      #current_user.client.
      
    else
      render :layout => false
    end
  end
    
  def view
    params[:playlist_param]
  
    render :layout => false
  end
end
  