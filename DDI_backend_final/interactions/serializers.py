# interactions/serializers.py
import re
from rest_framework import serializers

PAIR_SPLIT_RE = re.compile(r"\s*(?:\+|,)\s*")

class PairCheckSerializer(serializers.Serializer):
    selected_pair = serializers.CharField(required=False, allow_blank=True)
    drug1 = serializers.CharField(required=False, allow_blank=True)
    drug2 = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        sp = (data.get("selected_pair") or "").strip()
        d1 = (data.get("drug1") or "").strip()
        d2 = (data.get("drug2") or "").strip()

        if sp:
            parts = [p for p in PAIR_SPLIT_RE.split(sp) if p]
            if len(parts) != 2:
                raise serializers.ValidationError(
                    "selected_pair must contain exactly two drugs (e.g., 'aspirin + warfarin')."
                )
            d1, d2 = parts[0], parts[1]
        else:
            if not d1 or not d2:
                raise serializers.ValidationError(
                    "Provide either selected_pair or both drug1 and drug2."
                )

        data["drug1"], data["drug2"] = d1, d2
        return data
