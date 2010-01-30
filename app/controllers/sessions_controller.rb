class SessionsController < ApplicationController
  def create
    authenticate_with_open_id do |result, identity_url|
      if result.successful?
        set_current_user User.find_or_create_by_identity_url(identity_url)
        redirect_to(root_url)
      else
        failed_login result.message
      end
    end
  end
  
  def new 
    render :text => flash[:error]
  end
  
  def destroy
    session[:current_user_id] = @current_user = nil
    redirect_to(root_url)
  end

  private
    def set_current_user(user)
      session[:current_user_id] = user.id
      @current_user = user
    end

    def failed_login(message)
      p flash[:error]
      flash[:error] = message
      redirect_to(new_session_url)
    end
end