# Aplikacja do przechowywania szyfrowanych, stylowanych notatek
Końcowa wersja aplikacji znajduje się na gałęzi **dockerization-with-final-changes**, która została zmieniona na gałąź główną

## Uruchomienie 
Uruchomienie aplikacji następuje poprzez komendę docker-compose up. Przed uruchomieniem aplikacji należy poczekać aż wszystkie 
kontenery wystartują (Występuje opóźnienie między pełnym wystartowaniem kontenerów z bazą danych i frontendem a kontenerem z backendem). 
Gdy wszystkie kontenery wystartują dostanie się do aplikacji następuje poprzez wspisanie w przeglądarkę adresu https://localhost:4430
(**Uwaga** wejście na stronę aplikacji wymaga uprzedniego wejścia pod adres chrome://flags/#allow-insecure-localhost i zmiany 
*Allow invalid certificates for resources loaded from localhost.* na *enabled*)
