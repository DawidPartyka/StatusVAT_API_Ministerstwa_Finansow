# StatusVAT_API_Ministerstwa_Finansow
Aplikacja oparta o Node.JS w celu sprawdzenia statusu VAT w oparciu o podany numer NIP za pomocą API ministerstwa finansów.  
Lista statusów zostaje pobrana po stronie klienta w formie pliku tekstowego.  
W pierwszej kolejności sprawdzona zostaje baza danych lub moduł przechowujący dane w poszukiwaniu wyników  
dla żądanych numerów NIP na bieżący dzień.  
W przypadku wersji wykorzystującej moduł dane będą zachowane tak długo jak działać będzie serwer.  
Po jego wyłączeniu dane dodane w czasie działania aplikacji nie będą ponownie dostępne.  
Numery NIP nie znajdujące się w bazie/module na dany dzień zostaną do niej dodane po odpytaniu API MF.  
Walidacja numerów NIP i wykluczenie powtarzających się numerów ma miejsce po stronie klienta.  
  
Plik wejściowy: Jeden numer NIP na jedną linię.  
Przykładowe dane:  
7791011327  
5261037737  
7811897358  
7792092747  
7811897358  
7772702817  
6211766191  
6211803638  
7121008323  
8171058588  
2090001440  
  
Plik wyjściowy w formie pliku tekstowego:  
NIP:	7891788162  
Status:	Podmiot o podanym identyfikatorze podatkowym NIP jest zarejestrowany jako podatnik VAT czynny  
Kod:	C  
  
NIP:	8141019514  
Status:	Podmiot o podanym identyfikatorze podatkowym NIP jest zarejestrowany jako podatnik VAT czynny  
Kod:	C  
  
NIP:	8571091402  
Status:	Podmiot o podanym identyfikatorze podatkowym NIP jest zarejestrowany jako podatnik VAT czynny  
Kod:	C  
