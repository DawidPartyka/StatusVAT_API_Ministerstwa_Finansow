# StatusVAT_API_Ministerstwa_Finansow
Aplikacja oparta o Node.JS w celu sprawdzenia statusu VAT w oparciu o podany numer NIP za pomocą API ministerstwa finansów.  
Lista statusów zostaje pobrana po stronie klienta w formie pliku tekstowego.  
W pierwszej kolejności sprawdzona zostaje baza danych w poszukiwaniu wyników dla żądanych numerów NIP na bieżący dzień.  
Numery NIP nie znajdujące się w bazie na dany dzień zostaną do niej dodane po odpytaniu API MF.  
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
NIP:	7791011327  
Status:	Podmiot o podanym identyfikatorze podatkowym NIP jest zarejestrowany jako podatnik VAT czynny  
Kod:	C  
  
NIP:	5261037737  
Status:	Podmiot o podanym identyfikatorze podatkowym NIP jest zarejestrowany jako podatnik VAT czynny  
Kod:	C  
  
NIP:	7811897358  
Status:	Podmiot o podanym identyfikatorze podatkowym NIP jest zarejestrowany jako podatnik VAT czynny  
Kod:	C  

NIP:	7792092747  
Status:	Podmiot o podanym identyfikatorze podatkowym NIP jest zarejestrowany jako podatnik VAT czynny  
Kod:	C  
  
NIP:	7811897358  
Status:	Podmiot o podanym identyfikatorze podatkowym NIP jest zarejestrowany jako podatnik VAT czynny  
Kod:	C  
