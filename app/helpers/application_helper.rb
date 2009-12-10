# Methods added to this helper will be available to all templates in the application.
module ApplicationHelper
  
  def javascript_globals
    providers = {}
    Provider.all.each do |p|
      providers[p.id.to_s] = {:name => p.name, :icon_src => p.icon_src, :id => p.id}
    end
    {
      #:providers => Provider.all.group_by(&:id)
      :providers => providers
    }
  end
  
  def embed_player(url)
    escaped_url = URI.escape(url)
    '<object height="300" width="300">  <param name="movie" value="http://player.soundcloud.com/player.swf?url='+ escaped_url +'&amp;auto_play=false&amp;player_type=artwork&amp;color=ff7700"></param>  <param name="allowscriptaccess" value="always"></param>  <embed allowscriptaccess="always" height="300" src="http://player.soundcloud.com/player.swf?url='+ escaped_url +'&amp;auto_play=false&amp;player_type=artwork&amp;color=ff7700" type="application/x-shockwave-flash" width="300"> </embed> </object>'
  end
end
