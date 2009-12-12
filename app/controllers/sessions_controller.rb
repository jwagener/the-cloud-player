class SessionsController < ApplicationController
    def create
      open_id_authentication
    end


    protected
      def password_authentication(name, password)
        if @current_user = @account.users.authenticate(params[:name], params[:password])
          successful_login
        else
          failed_login "Sorry, that username/password doesn't work"
        end
      end

      def open_id_authentication
        authenticate_with_open_id do |result, identity_url|
          if result.successful?
            if session['current_user_id'] = User.find_or_create_by_identity_url(identity_url).id #@account.users.find_by_identity_url(identity_url)
              redirect_to(root_url)
            else
              failed_login "Sorry, no user by that identity URL exists (#{identity_url})"
            end
          else
            failed_login result.message
          end
        end
      end
    
    
    private
      def successful_login
        session[:current_user_id] = current_user.id
        redirect_to(root_url)
      end

      def failed_login(message)
        p message
        flash[:error] = message
        redirect_to(new_session_url)
      end
  end
