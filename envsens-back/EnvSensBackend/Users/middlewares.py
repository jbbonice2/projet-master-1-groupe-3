class LogIPAddressMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Récupérer l'adresse IP de l'origine de la requête
        # ip_address = request.META.get('REMOTE_ADDR')
        
        # Vous pouvez également capturer d'autres informations ici, telles que l'URL d'origine
        # referer = request.META.get('HTTP_REFERER')
        
        # # Logguer l'adresse IP (ou d'autres informations) comme vous le souhaitez
        print("body:", request.body)
        
        # # Passer la requête au middleware suivant ou à la vue
        response = self.get_response(request)
        
        return response
