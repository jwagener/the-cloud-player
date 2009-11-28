class PlaylistsController < ApplicationController
  def index
    render :layout => false
   # if logged_in?
   #   #current_user.client.
   #   render :json = {
   #     :
   #     
   #   }
   # else
   #   render :layout => false
   # end
  end
    
  def view
    params[:playlist_param]
  
    render :layout => false
  end
end
  